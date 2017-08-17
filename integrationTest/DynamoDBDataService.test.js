//@flow
import DynamoDBDao from "../src/DynamoDBDao"
import {REGION, startAndLoadData, stop} from './DynamoDBHelper'
import {DynamoDBDataService, USER_TABLE} from "../src/DynamoDBDataService"
import User from "../src/entity/User"

const {describe, it, expect,} = global
const AWS = require("aws-sdk")

describe('DynamoDBDao', () => {

    let port
    let service

    beforeEach(async () => {
        await startAndLoadData(false).then((assignedPort: number) => {
            port = assignedPort
            service = new DynamoDBDataService(REGION, `http://localhost:${port}`)
        }).then(() => {
            return service.init()
        }).catch((err) => {
            console.log("Error!")
            throw err
        })
    })

    afterEach(() => {
        stop(port)
    })

    it('should be able to create a user', (done) => {
        expect.assertions(2)

        const user = new User(undefined, "blah@somewhere.com")

        service.saveUser(user).then((user) => {

            expect(user.id).toBeDefined()

            const docClient = new AWS.DynamoDB.DocumentClient()

            const params = {
                TableName: USER_TABLE,
                Key: {
                    "id": user.id
                }
            }

            docClient.get(params, function (err, data) {
                if (err) {
                    console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2))
                } else {
                    console.log(data)
                    expect(data.Item.email).toEqual(user.email)
                    done()
                }
            })
        })
    })

})