#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LitellmProxyLambdaCdkStack } from '../lib/litellm-proxy-lambda-cdk-stack';

const app = new cdk.App();

const litellmMasterKey: string = app.node.tryGetContext('litellmMasterKey');
const hasPrivateEndpoint: boolean = app.node.tryGetContext('hasPrivateEndpoint');
const hasPublicEndpoint: boolean = app.node.tryGetContext('public_endpoint')!;
const vpcId: string = app.node.tryGetContext('vpcId');
const isVpcePrivateDnsEnable: boolean = app.node.tryGetContext('isVpcePrivateDnsEnable');

new LitellmProxyLambdaCdkStack(app, 'LitellmProxyLambdaCdkStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  litellmMasterKey,
  hasPrivateEndpoint,
  hasPublicEndpoint,
  vpcId,
  isVpcePrivateDnsEnable
});