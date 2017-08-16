import freeport from 'freeport'

const DynamoDbLocal = require('dynamodb-local')
const AWS = require("aws-sdk")
const fs = require('fs')

const region = "us-west-2"

export const startAndLoadData = (): Promise<number> => {
    let port
    return new Promise((resolve, reject) => {
        freeport((err, allocatedPort: number) => {
            if (err) {
                reject(err)
            } else {
                port = allocatedPort
                resolve(port)
            }
        })
    }).then(() => {
        console.log(`Starting DynamoDB on port ${port}`)

        DynamoDbLocal.launch(port, null, []).then(() => {
            return port
        })
    }).then(() => {
        console.log("DynamoDB ready.")

        const endpoint = `http://localhost:${port}`

        AWS.config.update({
            region,
            endpoint
        })

        return port
    }).then(() => {
        console.log("Creating sample data table.")

        const params = {
            TableName: "Movies",
            KeySchema: [
                {AttributeName: "year", KeyType: "HASH"},  //Partition key
                {AttributeName: "title", KeyType: "RANGE"}  //Sort key
            ],
            AttributeDefinitions: [
                {AttributeName: "year", AttributeType: "N"},
                {AttributeName: "title", AttributeType: "S"}
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 10,
                WriteCapacityUnits: 10
            }
        }

        return new Promise((resolve, reject) => {
            new AWS.DynamoDB().createTable(params, function (err, data) {
                if (err) {
                    console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2))
                    reject(err)
                } else {
                    resolve(port)
                }
            })
        })
    }).then(() => {
        console.log("Loading sample data.")

        const allMovies = JSON.parse(fs.readFileSync('./integrationTest/moviedata.json', 'utf8'))
        const docClient = new AWS.DynamoDB.DocumentClient()

        const promises = []
        allMovies.forEach(function (movie) {
            const params = {
                TableName: "Movies",
                Item: {
                    "year": movie.year,
                    "title": movie.title,
                    "info": movie.info
                }
            }

            promises.push(new Promise((resolve, reject) => {
                docClient.put(params, function (err, data) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(port)
                    }
                })
            }))
        })

        return new Promise((resolve, reject) => {
            return Promise.all(promises).then(() => resolve(port))
        })
    }).catch((err) => {
        console.log("Error!")
        throw err
    })
}

export const stop = (port: number) => DynamoDbLocal.stop(port)