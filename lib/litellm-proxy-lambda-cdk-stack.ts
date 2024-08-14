import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface LitellmProxyLambdaCdkStackProps extends cdk.StackProps {
  litellmMasterKey: string,
  hasPrivateEndpoint: boolean,
  hasPublicEndpoint: boolean,
  vpcId?: string,
  isVpcePrivateDnsEnable?: boolean,
}

export class LitellmProxyLambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LitellmProxyLambdaCdkStackProps) {
    super(scope, id, props);

    // Lambda Web Adapter Layer
    const webAdapterLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'WebAdapterLayer',
      `arn:aws:lambda:${this.region}:753240598075:layer:LambdaAdapterLayerArm64:23`
    );

    // Define Lambda function
    const litellmProxyLambda = new lambda.Function(this, 'LitellmProxyLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset('src/lambda', {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            'bash', '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output && chmod +x /asset-output/bootstrap'
          ],
        },
      }),
      memorySize: 256,
      timeout: cdk.Duration.seconds(300),
      environment: {
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/bootstrap',
        AWS_LWA_READINESS_CHECK_PATH: '/prod/health/readiness',
        LITE_LLM_MASTER_KEY: props.litellmMasterKey
      },
      layers: [webAdapterLayer],
    });

    // Grant access to Bedrock
    litellmProxyLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: ['*'],
    }));

    if(props.hasPrivateEndpoint){
      if (!props.vpcId){
        throw new Error('VPC ID must be provided for private endpoint deployment');
      }

      // Get existing VPC
      const vpc = ec2.Vpc.fromLookup(this, 'ExistingVpc', {
        vpcId: props.vpcId
      });

      // Create VPC Endpoint
      const vpcEndpoint = new ec2.InterfaceVpcEndpoint(this, 'ApiGatewayVpcEndpoint', {
        vpc,
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
        privateDnsEnabled: props.isVpcePrivateDnsEnable,
      });

      // Create API Gateway
      const api = new apigateway.LambdaRestApi(this, 'LitellmProxyApi', {
        handler: litellmProxyLambda,
        proxy: true,
        description: 'API for LiteLLM Proxy',
        endpointConfiguration: {
          types: [apigateway.EndpointType.PRIVATE],
          vpcEndpoints: [vpcEndpoint]
        },
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              principals: [new iam.AnyPrincipal()],
              actions: ['execute-api:Invoke'],
              resources: ['execute-api:/*'],
              conditions: {
                StringEquals: {
                  'aws:SourceVpce': vpcEndpoint.vpcEndpointId
                }
              }
            }),
          ],
        }),
      });
    }

    if(props.hasPublicEndpoint){
      // Create Lambda Function URL (Auth Type: NONE for public access)
      const functionUrl = litellmProxyLambda.addFunctionUrl({
        authType: lambda.FunctionUrlAuthType.NONE,
        invokeMode: lambda.InvokeMode.RESPONSE_STREAM
      });

      // Output
      new cdk.CfnOutput(this, 'Public URL', {
        value: functionUrl.url + "prod/",
        description: 'Lambda Function URL (Public)',
      });
    } 
  }
}