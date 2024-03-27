const { connectToDatabase } = require("../db/dbConnector")
const { z } = require("zod")
const middy = require("middy")
const { authorize } = require("../util/authorizer")
const { errorHandler } = require("../util/errorHandler")
const { bodyValidator } = require("../util/bodyValidator")

const DepartmentSchema = z.object({
	name: z.string().min(3, {
		message: "Department name must be at least 3 characters long",
	}),
	id: z.number().int(),
})

exports.handler = middy(async (event, context) => {
	context.callbackWaitsForEmptyEventLoop = false
	const org_id = event.requestContext.authorizer.claims['custom:org_id'];
	const { name, id } = JSON.parse(event.body)
	const client = await connectToDatabase()

	const result = await client.query(
		`UPDATE department SET name = $1 WHERE id = $2 AND  org_id = $3 RETURNING *`,
		[name, id,org_id],
	)
	if (result.rowCount === 0) {
		return {
			statusCode: 404,
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			body: JSON.stringify({
				message: "Department not found",
			}),
		}
	}
	const updatedDepartment = result.rows[0]
	return {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Origin": "*",
		},
		body: JSON.stringify(updatedDepartment),
	}
})
	.use(authorize())
	.use(bodyValidator(DepartmentSchema))
	.use(errorHandler())
