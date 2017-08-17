//@flow
import ColumnDefinition from "./ColumnDefinition"

const AWS = require("aws-sdk")

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

    createTable(name: string, columns: Array<ColumnDefinition>): Promise<string> {

        const dynamodb = new AWS.DynamoDB()

        const keySchema = [
            {AttributeName: "id", KeyType: "HASH"},  //Partition key
            {AttributeName: "email", KeyType: "RANGE"}  //Sort key
        ]

        const additionalColumnDefinitions = columns.map((column: ColumnDefinition) => {
            return {
                AttributeName: column.name,
                AttributeType: "string" === column.type ? "S" : 'N'
            }
        })
        const columnDefinitions = [
            {AttributeName: "id", AttributeType: "S"},
            ...additionalColumnDefinitions
        ]

        const params = {
            TableName: name,
            KeySchema: keySchema,
            AttributeDefinitions: columnDefinitions,
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 10
            }
        }

        return new Promise((resolve, reject) => {
            dynamodb.createTable(params, function (err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2))
                    resolve("Created table")
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