import Airtable from "airtable";
import { assignmentStatuses } from "../constants/assignment-statuses";

const tableName = "Outreach";
const { Pool } = require("pg");
const connectionString = process.env.PG_CONNECTION_STRING;
const pool = new Pool({ connectionString });

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: "https://proxy.syncinc.so/api.airtable.com",
}).base(process.env.AIRTABLE_BASE);

export const updateOutreach = async (
  outreachId,
  status,
  reasonForRejection,
) => {
  return base(tableName).update([
    {
      id: outreachId,
      fields: {
        Status: status,
        "Reason for rejection": reasonForRejection,
      },
    },
  ]);
};
export const accept = async (
  outreachId,
  assignmentId,
  writerId,
  writerRate,
) => {
  await updateOutreach(outreachId, "Accepted");
  return base("Assignments").update([
    {
      id: assignmentId,
      fields: {
        Writer: [writerId],
        "Writer Payout": Number(writerRate),
        Status: assignmentStatuses.writing,
        "Writer Confirmed": new Date().toISOString(),
      },
    },
  ]);
};

export const reject = (outreachId, reasonForRejection) =>
  updateOutreach(outreachId, "Rejected", reasonForRejection);

export const getOutreaches = async (type, email) => {
  if (!["all", "past", "pending"].includes(type)) {
    return {
      data: null,
      error: "'type' can be one of 'all', 'past', or 'pending'",
    };
  }

  const outreach_status_query = {
    all: "1=1",
    past: "outreach.status in ('Accepted', 'Rejected') or outreach.expired = 'Yes'",
    pending: "outreach.status is null and outreach.expired != 'Yes'",
  };
  try {
    const query = `select outreach.id,
                        outreach.status,
                        outreach.reached_out_on,
                        outreach.expired,
                        assignments.writer_due_date,
                        assignments.title,
                        assignments.id as assignment_id,
                        writers.email
                     from outreach
                            join writers on writers.id = ANY (outreach.writer)
                            join assignments on assignments.id = ANY(outreach.assignment)
                     where writers.email like $1 and (writers.status='Accepted' or writers.status = 'Potential Dev Writer') and (${outreach_status_query[type]})
                     and assignments.writer_due_date is not null
                     group by assignments.title, assignments.id, outreach.id, assignments.writer_due_date, writers.email, outreach.status, outreach.reached_out_on, outreach.expired
                     order by assignments.writer_due_date desc;`;
    const { rows } = await pool.query(query, [email]);

    return { data: rows, error: null };
  } catch (e) {
    // Handle any errors
    console.error(e);
    return { data: null, error: e };
  }
};

export const getSingleOutreach = async (outreachId, email) => {
  try {
    const query = `select outreach.id,
                        outreach.status,
                        outreach.reached_out_on,
                        outreach.expired,
                        assignments.writer_due_date,
                        assignments.title,
                        assignments.status as assignment_status,
                        assignments.id as assignment_id,
                        writers.email,
                        writers.id as writer_id,
                        writers.rate as writer_rate
                     from outreach
                            join writers on writers.id = ANY (outreach.writer)
                            join assignments on assignments.id = ANY(outreach.assignment)
                     where outreach.id = $1 and writers.email like $2 and (writers.status='Accepted' or writers.status = 'Potential Dev Writer')
                     and assignments.writer_due_date is not null
                     group by assignments.title, assignments.id, outreach.id, assignments.writer_due_date, writers.email, writers.id, writers.rate, outreach.status, outreach.reached_out_on, outreach.expired, assignments.status
                     order by assignments.writer_due_date desc;`;
    const { rows } = await pool.query(query, [outreachId, email]);

    return { data: rows[0], error: null };
  } catch (e) {
    // Handle any errors
    console.error(e);
    return { data: null, error: e };
  }
};
