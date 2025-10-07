const tableName = "Requests";
const { Pool } = require("pg");
const Airtable = require("airtable");
const { getWriter } = require("./writers");
const { getSingleAssignment } = require("./assignments");
const connectionString = process.env.PG_CONNECTION_STRING;
const pool = new Pool({ connectionString });

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: "https://proxy.syncinc.so/api.airtable.com",
}).base(process.env.AIRTABLE_BASE);

export const createRequest = async (assignmentId, writerId) => {
  try {
    const result = await base(tableName).create([
      {
        fields: {
          Assignment: [assignmentId],
          Writer: [writerId],
        },
      },
    ]);
    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e };
  }
};

export const getRequests = async (type, email) => {
  if (!["all", "past", "pending"].includes(type)) {
    return {
      data: null,
      error: "'type' can be one of 'all', 'past' or 'present'",
    };
  }
  const request_status_query = {
    all: "1=1",
    past: "requests.request_status not like 'Pending'",
    pending: "requests.request_status like 'Pending'",
  };
  try {
    // Get assignments for user
    const query = `select requests.id,
                        requests.request_status,
                        requests.request_date,
                        assignments.writer_due_date,
                        assignments.title,
                        assignments.id as assignment_id
                     from requests
                            join writers on writers.id = ANY (requests.writer)
                            join assignments on assignments.id = ANY(requests.assignment)
                     where writers.email like $1 and writers.status='Accepted' and ${request_status_query[type]}
                     and assignments.writer_due_date is not null
                     group by assignments.title, assignments.id, requests.id, assignments.writer_due_date, requests.request_status, requests.request_date
                     order by assignments.writer_due_date desc;`;
    const { rows } = await pool.query(query, [email]);

    return { data: rows, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
};

export const getSingleRequest = async (requestId, email) => {
  try {
    const query = `select requests.id,
                        requests.request_status,
                        requests.request_date,
                        assignments.writer_due_date,
                        assignments.title,
                        assignments.id as assignment_id
                     from requests
                            join writers on writers.id = ANY (requests.writer)
                            join assignments on assignments.id = ANY(requests.assignment)
                     where requests.id = $1 and writers.email like $2 and writers.status='Accepted'
                     and assignments.writer_due_date is not null
                     group by assignments.title, assignments.id, requests.id, assignments.writer_due_date, requests.request_status, requests.request_date
                     order by assignments.writer_due_date desc;`;
    const { rows } = await pool.query(query, [requestId, email]);

    return { data: rows, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
};

export const deleteRequest = async (requestId) => {
  try {
    const result = await base(tableName).destroy(requestId);

    return { data: result, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e };
  }
};
