//@flow
import DynamoDBDao from "./DynamoDBDao"
import User from "../entity/User"

import uuid from 'uuid'
import ColumnDefinition from "../ColumnDefinition"

export const USER_TABLE = "User"

export class DynamoDBDataService {

    dao: DynamoDBDao

    constructor(region: string, endpoint: string) {
        this.dao = new DynamoDBDao(region, endpoint)
    }

    init(): Promise<void> {
        // DynamoDB secondary indexes don't guarantee uniqueness, so this wouldn't help
        const secondaryIndex = [new ColumnDefinition("email", "string")]
        return this.dao.createTable('User', [])
    }

    saveUser(user: User): Promise<User> {
        const id = uuid.v1()
        const fields = {"email": user.email}

        user.id = id

        return this.dao.insert(USER_TABLE, {"id": id}, fields).then(() => Promise.resolve(user))
    }
}