//@flow
import DynamoDBDao from "../src/DynamoDBDao"
import ColumnDefinition from "../src/ColumnDefinition"
import freeport from 'freeport'

const {describe, it, expect,} = global
const AWS = require("aws-sdk")
const DynamoDbLocal = require('dynamodb-local')

describe('DynamoDBDataService', () => {

    const region = "us-west-2"

    let dynamoLocalPort
    let endpoint
    let service

    beforeEach(async () => {
        await new Promise((resolve, reject) => {
            freeport((err, port) => {
                if (err) reject(err)
                resolve(port)
            })
        }).then((port) => {
            dynamoLocalPort = port

            console.log(`Starting DynamoDB on port ${dynamoLocalPort}`)

            return DynamoDbLocal.launch(dynamoLocalPort, null, [])
        }).then(() => {
            console.log("DynamoDB ready!")

            endpoint = `http://localhost:${dynamoLocalPort}`
            service = new DynamoDBDao(region, endpoint)
        }).catch((err) => {
            throw err
        })
    })

    afterEach(() => {
        DynamoDbLocal.stop(dynamoLocalPort)
    })

    it('should be able to create, insert into, and query from tables', (done) => {

            expect.assertions(2)

            const name = "user"
            const id = "1"

            return service.createTable(name, [new ColumnDefinition("email", "string")])
                .then(() => {

                    AWS.config.update({
                        region,
                        endpoint
                    })

                    const dynamoDB = new AWS.DynamoDB()

                    const params = {
                        ExclusiveStartTableName: 'table_name', // optional (for pagination, returned as LastEvaluatedTableName)
                        Limit: 1, // optional (to further limit the number of table names returned per page)
                    }
                    dynamoDB.listTables(params, function (err, data) {
                        if (err) {
                            console.log(err) // an error occurred
                        } else {
                            expect(data.TableNames).toEqual([name])
                        }
                    })
                })
                .then(() => service.insert(name, id, new ColumnDefinition("email", 'someemail@blah.com')))
                .then(() => {

                    const docClient = new AWS.DynamoDB.DocumentClient()

                    const params = {
                        TableName: name,
                        Key: {
                            "id": id
                        },
                        KeyConditionExpression: "#id = :id",
                        ExpressionAttributeNames: {
                            "#id": "id"
                        },
                        ExpressionAttributeValues: {
                            ":id": id
                        }
                    }

                    docClient.query(params, function (err, data) {
                        if (err) {
                            console.error("Unable to query. Error:", JSON.stringify(err, null, 2))
                        } else {
                            console.log("Query succeeded.")

                            expect(data.Items).toEqual([{"id": id, "email": "blah@blah.com"}])
                            done()
                        }
                    })
                })
        }
    )
})