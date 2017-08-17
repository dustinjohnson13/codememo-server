//@flow
import freeport from 'freeport'

const DynamoDbLocal = require('dynamodb-local')
const AWS = require("aws-sdk")
const fs = require('fs')

export const REGION = "us-west-2"
export const SAMPLE_DATA_TABLE_NAME = "Movies"

export const startAndLoadData = (useSamples: boolean): Promise<number> => {
    return allocatePort()
        .then(port => startDynamoDB(port))
        .then(port => prepareAWSConfig(port))
        .then(port => createSampleTable(port, useSamples))
        .then(port => loadSampleData(port, useSamples))
        .catch((err) => {
            console.log("Error!")
            throw err
        })
}

export const stop = (port: number) => DynamoDbLocal.stop(port)

const allocatePort = () => {
    return new Promise((resolve, reject) => {
        freeport((err, port: number) => {
            if (err) {
                reject(err)
            } else {
                resolve(port)
            }
        })
    })
}

const startDynamoDB = (port: number) => {
    console.log(`Starting DynamoDB on port ${port}`)

    return DynamoDbLocal.launch(port, null, []).then(() => port)
}

const prepareAWSConfig = (port: number) => {
    const endpoint = `http://localhost:${port}`
    console.log(`DynamoDB ready at ${endpoint}.`)

    AWS.config.update({
        region: REGION,
        endpoint
    })

    return port
}

const createSampleTable = (port: number, loadSampleData: boolean) => {
    if (!loadSampleData) {
        return Promise.resolve(port)
    }

    return new Promise((resolve, reject) => {
        console.log("Creating sample data table.")

        const params = {
            TableName: SAMPLE_DATA_TABLE_NAME,
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
        new AWS.DynamoDB().createTable(params, function (err, data) {
            if (err) {
                console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2))
                reject(err)
            } else {
                resolve(port)
            }
        })
    })
}

const loadSampleData = (port: number, loadSampleData: boolean) => {
    if (!loadSampleData) {
        return Promise.resolve(port)
    }

    console.log("Loading sample data.")

    const allMovies = JSON.parse(fs.readFileSync('./integrationTest/moviedata.json', 'utf8'))
    const docClient = new AWS.DynamoDB.DocumentClient()

    const promises = allMovies.map((movie) => {
        const params = {
            TableName: SAMPLE_DATA_TABLE_NAME,
            Item: {
                "year": movie.year,
                "title": movie.title,
                "info": movie.info
            }
        }

        return new Promise((resolve, reject) => {
            docClient.put(params, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve(port)
                }
            })
        })
    })

    return Promise.all(promises).then(() => port)
}