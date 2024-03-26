var AWS = require('@aws-sdk/client-secrets-manager');
var logger = require('./logger');

class SecretsManager {



    /**
     * Uses AWS Secrets Manager to retrieve a secret by secretKey
     */
    static async getSecret(secretKey) {


        var config = 'us-east-1';
        var secretName = 'rds!db-3b4d33dd-e122-4573-b55c-2b7639a4906f';

        let secretsManager = new AWS.SecretsManager(config);
        try {
            let secretValue = await secretsManager.getSecretValue({ SecretId: secretName })

            const secretsObject = JSON.parse(secretValue.SecretString);

            if (secretsObject[secretKey] !== null) {
                return secretsObject[secretKey];
            } else {
                logger.info("log no secrets found for secret name.")
            }

        } catch (err) {
            logger.error(err);
        }
    }
}
module.exports = SecretsManager;