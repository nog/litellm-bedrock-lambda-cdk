# LiteLLM Proxy Lambda CDK

This project demonstrates how to deploy a LiteLLM Proxy using AWS CDK with TypeScript. It supports both public and private deployments, each with its own advantages and considerations.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js and npm installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Project Structure

```
litellm-proxy-lambda-cdk/
├── bin/
│   └── litellm-proxy-lambda-cdk.ts
├── lib/
│   └── litellm-proxy-lambda-cdk-stack.ts
├── src/
│   └── lambda/
│       ├── bootstrap
│       ├── config.yaml
│       └── requirements.txt
├── cdk.sample.json
├── package.json
└── tsconfig.json
```

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/nog/litellm-proxy-lambda-cdk.git
   cd litellm-proxy-lambda-cdk
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy `cdk.sample.json` to `cdk.json` and update it with your desired configuration:
   ```
   cp cdk.sample.json cdk.json
   ```
   Edit `cdk.json` to set your specific VPC information and other required parameters.

## Deployment Options

### Public Endpoint (Lambda Function URL)

Advantages:
- Supports Response Streaming
- Direct access to Lambda functionality

Deployment command:
```
cdk deploy
```

⚠️ **CAUTION**:
- The Lambda Function URL will be publicly accessible on the internet.
- Implement robust security measures to prevent unauthorized use.
- Ensure proper authentication and rate limiting are in place.

### Private Endpoint (API Gateway with VPC Endpoint)

Advantages:
- Restricted access within a VPC
- Enhanced network-level security

Deployment command:
```
cdk deploy
```

⚠️ **CAUTION**:
- Response Streaming is not supported with API Gateway.
- Updating Private DNS settings may affect DNS resolution for API Gateway custom domains.
- VPC Endpoints incur hourly charges, even when not in use.

## Configuration

Edit `cdk.json` to configure the following:

- `litellmMasterKey`: Your LiteLLM Master Key (starts with "sk-").
- `hasPublicEndpoint`: Set to `true` for public Lambda Function URL, `false` for no public endpoint.
- `hasPrivateEndpoint`: Set to `true` for private API Gateway with VPC Endpoint.
- `vpcId`: Your VPC ID (required for private endpoint).
- `isVpcePrivateDnsEnable`: Enable/disable private DNS for VPC Endpoint.

## Security

- The LiteLLM Master Key is stored securely as an environment variable.
- For private deployments, access is restricted to the specified VPC.
- For public deployments, implement additional security measures like API key authentication and request limiting.

## Cleanup

To remove all resources created by this stack:
```
cdk destroy
```

## Important Notes

1. **Public Endpoint**: 
   - ⚠️ The Lambda Function URL is publicly accessible. Implement strong security measures.
   - ✅ Supports Response Streaming for better performance with large responses.

2. **Private Endpoint**:
   - ❌ Does not support Response Streaming.
   - ⚠️ Updating Private DNS settings may affect DNS resolution for non-custom domain API Gateways.
   - 💰 VPC Endpoints incur hourly charges, even when idle.

3. **General**:
   - Always review and test your security settings before deploying to production.
   - Monitor your AWS costs, especially when using VPC Endpoints.
   - Regularly update your dependencies and review AWS best practices.