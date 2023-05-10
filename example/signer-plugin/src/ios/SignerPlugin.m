/*
 * Copyright (c) Juspay Technologies.
 *
 * This source code is licensed under the AGPL 3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/********* hyper-sdk-cordova-plugin.m Cordova Plugin Implementation *******/

#import <Cordova/CDV.h>
#import <CommonCrypto/CommonDigest.h>
#import <Security/Security.h>

@interface SignerPlugin : CDVPlugin
@end

@implementation SignerPlugin

- (void)sign:(CDVInvokedUrlCommand*)command{
    CDVPluginResult* pluginResult = nil;

    NSString *arguments1 = [command.arguments objectAtIndex:0];
    NSDictionary *arguments = [NSJSONSerialization JSONObjectWithData:[arguments1 dataUsingEncoding:NSUTF8StringEncoding] options:NSJSONReadingAllowFragments error:nil];
    
    if (arguments && arguments.count>0) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[self PKCSSignBytesSHA256withRSA:arguments[@"data"] withKey:arguments[@"key"]]];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
    }

    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (NSString*)PKCSSignBytesSHA256withRSA:(NSString*)plainText withKey:(NSString *)key{
    
    NSData *keyData = [[NSData alloc] initWithBase64EncodedString:[key stringByReplacingOccurrencesOfString:@"\n" withString:@""] options:0];
    NSDictionary* options = @{(id)kSecAttrKeyType: (id)kSecAttrKeyTypeRSA,
                              (id)kSecAttrKeyClass: (id)kSecAttrKeyClassPrivate};
    CFErrorRef error = NULL;
    SecKeyRef privateKey = SecKeyCreateWithData((__bridge CFDataRef)keyData,
                                                 (__bridge CFDictionaryRef)options, &error);
    
    if (error) {
        return @"";
    }
    
    CFDataRef cData = (__bridge CFDataRef)([plainText dataUsingEncoding:NSUTF8StringEncoding]);
    
    NSData *sign = CFBridgingRelease(SecKeyCreateSignature(privateKey, kSecKeyAlgorithmRSASignatureMessagePKCS1v15SHA256, cData, &error));

    if (error) {
        return @"";
    }

    return [sign base64EncodedStringWithOptions:0];
}

- (void)getClientAuthToken:(CDVInvokedUrlCommand*)command{
    __block CDVPluginResult* pluginResult = nil;

    NSDictionary *arguments = [command.arguments objectAtIndex:0];
    
    if (arguments && arguments.count>0) {
        
        NSString *customerId = arguments[@"customerId"];
        NSString *encodedApiKey = arguments[@"encodedApiKey"];
        NSString *authValue = [NSString stringWithFormat:@"Basic %@", encodedApiKey];
        
        NSString *urlString = [NSString stringWithFormat:@"https://sandbox.juspay.in/customers/%@?options.get_client_auth_token=true", customerId];

        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:urlString]
                                                               cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                           timeoutInterval:20.0];
        [request setHTTPMethod:@"GET"];
        [request setValue:authValue forHTTPHeaderField:@"Authorization"];

        NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]];

        [[session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {

            if(data) {
                NSError *dataError;
                [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&dataError];

                if(!dataError) {

                    NSDictionary *customerData = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];

                    if ([customerData valueForKey:@"juspay"]) {

                        NSString *token = [[customerData valueForKey:@"juspay"] valueForKey:@"client_auth_token"];
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:token];
                    } else {
                        NSLog(@"client_auth_token is not available in the response");
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
                    }
                } else {
                    NSLog(@"%@", [NSString stringWithFormat:@"Error in token format: %@", dataError.description]);
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
                }
            }

            if(error) {
                NSLog(@"%@", [NSString stringWithFormat:@"Error in getting token from server: %@", error.description]);
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
            }
            
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }] resume];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

- (void)createOrder:(CDVInvokedUrlCommand*)command{
    __block CDVPluginResult* pluginResult = nil;

    NSDictionary *arguments = [command.arguments objectAtIndex:0];
    
    if (arguments && arguments.count>0) {

        NSString *urlString = @"https://sandbox.juspay.in/order/create";
        NSString *customerId = arguments[@"customerId"];
        NSString *amount = arguments[@"amount"];
        NSString *returnUrl = arguments[@"returnUrl"];
        NSString *orderId = arguments[@"orderId"];
        NSString *encodedApiKey = arguments[@"encodedApiKey"];
        NSString *customerEmail = arguments[@"customerEmail"]
        NSString *customerPhone = arguments[@"customerPhone"]
        NSString *authValue = [NSString stringWithFormat:@"Basic %@", encodedApiKey];

        NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:urlString]
                                                               cachePolicy:NSURLRequestUseProtocolCachePolicy
                                                           timeoutInterval:20.0];
        [request setHTTPMethod:@"POST"];
        [request setValue:@"2018-07-01" forHTTPHeaderField:@"version"];
        [request setValue:authValue forHTTPHeaderField:@"Authorization"];

        NSString *customerPostData =[NSString stringWithFormat:@"amount=%@&currency=INR&customer_email=%@&customer_id=%@&customer_phone=%@&order_id=%@&return_url=%@&options.get_client_auth_token=true", amount, customerEmail, customerId, customerPhone, orderId, returnUrl];

        NSData *dataBody = [customerPostData dataUsingEncoding:NSUTF8StringEncoding];
        [request setHTTPBody:dataBody];

        NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]];

        [[session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {

            if(data && !error) {

                NSError *dataError;
                NSDictionary *orderResponse = [NSJSONSerialization JSONObjectWithData:data options:kNilOptions error:&dataError];

                if(!dataError && [orderResponse valueForKey:@"status"]) {

                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:orderResponse];
                } else {

                    NSLog(@"%@", [NSString stringWithFormat:@"Error while creating order: %@", error.description]);
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
                }
            }

            if(error) {
                NSLog(@"%@", [NSString stringWithFormat:@"Error while creating order: %@", error.description]);
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
            }
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }] resume];
        
        
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }
}

@end
