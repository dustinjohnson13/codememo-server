//@flow
import ColumnDefinition from "./ColumnDefinition"

const AWS = require("aws-sdk")

export default class DynamoDBDao {

    region: string
    endpoint: string

    constructor(region: string, endpoint: string) {
        this.region = region
        this.endpoint = endpoint
    }

    createTable(name: string, columns: Array<ColumnDefinition>): Promise<string> {

        AWS.config.update({
            region: this.region,
            endpoint: this.endpoint
        })

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

    insert(table: string, id: string, values: Array<ColumnDefinition>): Promise<string> {

        AWS.config.update({
            region: this.region,
            endpoint: this.endpoint
        })

        const docClient = new AWS.DynamoDB.DocumentClient();

        const params = {
            TableName: table,
            Item: {
                "id": id,
                "email": "blah@blah.com",
            }
        }

        console.log("Adding a new item...")
        return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                if (err) {
                    console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    console.log("Added item:", JSON.stringify(data, null, 2))
                    resolve(data)
                }
            })
        })
    }
}