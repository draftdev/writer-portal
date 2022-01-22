const {Pool} = require("pg");
const connectionString = process.env.PG_CONNECTION_STRING;
const pool = new Pool({connectionString});
import { requireSession, users } from "@clerk/nextjs/api";

export default requireSession(async (req, res) => {
    try {
        const {assignmentId} = req.query;
        // Get user from Clerk API
        const user = await users.getUser(req.session.userId);

        if (req.method === "GET") {
            // Get assignment by assignmentId
            const query = `select assignments.title,
                                  assignments.id,
                                  assignments.client_name,
                                  assignments.status,
                                  assignments.pitch,
                                  assignments.brief_url,
                                  assignments.outline,
                                  assignments.published_url,
                                  assignments.writer_email,
                                  assignments.writer_payout,
                                  assignments.writer_due_date,
                                  assignments.writer_paid_date,
                                  assignments.writer_deliverables,
                                  assignments.writer,
                                  your_requests.request_date,
                                  your_requests.id as request_id
                           from assignments
                           left join (
                               select * from requests
                               where $2 = ANY (writer_email)
                           ) as your_requests on your_requests.id = ANY (assignments.requests)
                           where assignments.id like $1;`;
            const {rows} = await pool.query(query, [assignmentId, user.emailAddresses[0].emailAddress]);

            // Respond with results
            res.statusCode = 200;
            res.json(rows[0]);
        }
    } catch (e) {
        // Handle any errors
        console.log(e);
        res.statusCode = 500;
        res.end("Server error. Something went wrong.");
    }
});
