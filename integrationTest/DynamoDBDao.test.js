//@flow
import DynamoDBDao from "../src/DynamoDBDao"
import ColumnDefinition from "../src/ColumnDefinition"
import {REGION, SAMPLE_DATA_TABLE_NAME, startAndLoadData, stop} from './DynamoDBHelper'

const {describe, it, expect,} = global
const AWS = require("aws-sdk")

describe('DynamoDBDao', () => {

    let port
    let endpoint
    let service

    beforeEach(async () => {
        await startAndLoadData().then((assignedPort: number) => {
            port = assignedPort
            console.log(`Creating service for port ${port}.`)

            endpoint = `http://localhost:${port}`
            service = new DynamoDBDao(REGION, endpoint)
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

        const table = SAMPLE_DATA_TABLE_NAME
        const year = 2013
        const title = "After Earth"
        const key = {"year": year, "title": title}

        service.findOne(table, key).then((results) => {
            expect(results.Item.info.rating).toEqual(4.9)
            done()
        })
    })

    it('should be able to create tables', (done) => {

        expect.assertions(1)

        const name = "user"

        return service.createTable(name, [new ColumnDefinition("email", "string")])
            .then(() => {

                const dynamoDB = new AWS.DynamoDB()

                const params = {}

                dynamoDB.listTables(params, function (err, data) {
                    if (err) {
                        console.log(err) // an error occurred
                    } else {
                        expect(data.TableNames).toEqual([SAMPLE_DATA_TABLE_NAME, name])
                        done()
                    }
                })
            })
    })

    it('should be able to drop tables', (done) => {

        expect.assertions(1)

        return service.dropTable(SAMPLE_DATA_TABLE_NAME)
            .then(() => {

                const dynamoDB = new AWS.DynamoDB()

                const params = {}

                dynamoDB.listTables(params, function (err, data) {
                    if (err) {
                        console.log(err) // an error occurred
                    } else {
                        expect(data.TableNames).toEqual([])
                        done()
                    }
                })
            })
    })

    it('should be able to insert into tables', (done) => {

        expect.assertions(2)

        const year = 2016
        const title = "Some Great Movie"

        const table = SAMPLE_DATA_TABLE_NAME
        const key = {"year": year, "title": title}
        const fields = {"info": {"one": 1, "something": "cool"}}

        return service.insert(table, key, fields)
            .then(() => {
                const docClient = new AWS.DynamoDB.DocumentClient()

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
                        expect(data.Item.info.one).toEqual(1)
                        expect(data.Item.info.something).toEqual("cool")
                        done()
                    }
                })
            })
    })
})