//@flow
import DynamoDBDao from "../src/DynamoDBDao"
import ColumnDefinition from "../src/ColumnDefinition"
import {startAndLoadData, stop} from './DynamoDBHelper'

const {describe, it, expect,} = global
const AWS = require("aws-sdk")

describe('DynamoDBDao', () => {

    const region = "us-west-2"

    let port
    let endpoint
    let service

    beforeEach(async () => {
        await startAndLoadData().then((assignedPort: number) => {
            port = assignedPort
            console.log(`Creating service for port ${port}.`)

            endpoint = `http://localhost:${port}`
            service = new DynamoDBDao(region, endpoint)
        }).catch((err) => {
            console.log("Error!")
            throw err
        })
    })

    afterEach(() => {
        stop(port)
    })

    it('should be able to query from tables', (done) => {
        expect.assertions(1)

        const docClient = new AWS.DynamoDB.DocumentClient()

        const table = "Movies"
        const year = 2013
        const title = "After Earth"

        const params = {
            TableName: table,
            Key: {
                "year": year,
                "title": title
            }
        }

        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
            } else {
                expect(data.Item.info.rating).toEqual(4.9)
                done()
            }
        })
    })

    it('should be able to create, insert into, and query from tables', (done) => {

        expect.assertions(2)

        const name = "user"
        const id = "1"

        return service.createTable(name, [new ColumnDefinition("email", "string")])
            .then(() => {

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
    })
})