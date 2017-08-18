//@flow
import IndexDefinition from "../IndexDefinition"

const AWS = require("aws-sdk")

const DEFAULT_READ_CAPACITY_UNITS = 5
const DEFAULT_WRITE_CAPACITY_UNITS = 5

export default class DynamoDBDao {

    region: string
    endpoint: string

    constructor(region: string, endpoint: string) {
        this.region = region
        this.endpoint = endpoint

        AWS.config.update({
            region: this.region,
            endpoint: this.endpoint
        })
    }

    createTable(name: string, indices: Array<IndexDefinition>): Promise<void> {

        const dynamodb = new AWS.DynamoDB()

        const keySchema = [
            {AttributeName: "id", KeyType: "HASH"}
        ]

        const additionalIndexDefinitions = indices.map((index: IndexDefinition) => {
            return {
                AttributeName: index.name,
                AttributeType: "string" === index.type ? "S" : 'N'
            }
        })
        const columnDefinitions = [
            {AttributeName: "id", AttributeType: "S"},
            ...additionalIndexDefinitions
        ]

        const params = {
            TableName: name,
            KeySchema: keySchema,
            AttributeDefinitions: columnDefinitions,
            ProvisionedThroughput: {
                ReadCapacityUnits: DEFAULT_READ_CAPACITY_UNITS,
                WriteCapacityUnits: DEFAULT_WRITE_CAPACITY_UNITS
            }
        }

        if (indices.length > 0) {
            // $FlowFixMe
            params["GlobalSecondaryIndexes"] = indices.map((column: IndexDefinition) => {
                return {
                    IndexName: column.name,
                    KeySchema: [
                        {
                            AttributeName: column.name,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "KEYS_ONLY"
                    },
                    ProvisionedThroughput: {
                        "ReadCapacityUnits": DEFAULT_READ_CAPACITY_UNITS,
                        "WriteCapacityUnits": 1
                    }
                }
            })
        }

        return new Promise((resolve, reject) => {
            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    dropTable(name: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const params = {
                TableName: name
            }

            const dynamodb = new AWS.DynamoDB()

            dynamodb.deleteTable(params, function (err, data) {
                if (err) {
                    console.error("Unable to drop table. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve("Dropped table")
                }
            })
        })
    }

    insert(table: string, key: { [string]: string | number }, fields: { [string]: any }): Promise<any> {
        const docClient = new AWS.DynamoDB.DocumentClient()

        const item = Object.assign({}, key, fields)
        const params = {
            TableName: table,
            Item: item
        }

        return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    update(table: string, key: { [string]: string | number }, fields: [Map<string, *>]): Promise<any> {
        const docClient = new AWS.DynamoDB.DocumentClient()

        const expressions = []
        const expressionValues = {}

        let fieldNum = 0
        for (let field of fields) {
            for (let [k, v] of field) {
                expressions.push(`${k} = :${fieldNum}`)
                expressionValues[`:${fieldNum++}`] = v
            }
        }

        const params = {
            TableName: table,
            Key: key,
            UpdateExpression: 'SET ' + expressions.join(","),
            ExpressionAttributeValues: expressionValues
        }

        return new Promise((resolve, reject) => {
            docClient.update(params, function (err, data) {
                if (err) {
                    console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    delete(table: string, key: { [string]: string | number }): Promise<any> {
        const docClient = new AWS.DynamoDB.DocumentClient()

        const params = {
            TableName: table,
            Key: key
        }

        return new Promise((resolve, reject) => {
            docClient.delete(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    findOne(table: string, key: { [string]: string | number }): Promise<any> {
        const docClient = new AWS.DynamoDB.DocumentClient()

        const params = {
            TableName: table,
            Key: key
        }
        return new Promise((resolve, reject) => {
            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }
}