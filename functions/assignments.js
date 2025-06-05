import Airtable from "airtable";
import { assignmentStatuses } from "../constants/assignment-statuses";

const tableName = "Assignments";
const { Pool } = require("pg");
const connectionString = process.env.PG_CONNECTION_STRING;
const pool = new Pool({ connectionString });

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
  endpointUrl: "https://proxy.syncinc.so/api.airtable.com",
}).base(process.env.AIRTABLE_BASE);

export const accept = (assignmentId) => {
  const today = new Date().toISOString();
  return base(tableName).update([
    {
      id: assignmentId,
      fields: {
        "Writer Confirmed": today,
        Status: assignmentStatuses.writing,
      },
    },
  ]);
};

export const submit = (assignmentId) => {
  const today = new Date().toISOString();
  return base(tableName).update([
    {
      id: assignmentId,
      fields: {
        "Writer Submitted": today,
        Status: assignmentStatuses.tech_review,
      },
    },
  ]);
};

export const getAssignments = async (type, email) => {
  if (!["all", "current"].includes(type)) {
    return {
      data: null,
      error: "'type' can be one of 'all', or 'current'",
    };
  }
  const article_query = {
    all: "1=1",
    current: `assignments.status in ('${assignmentStatuses.writing}', '${assignmentStatuses.assigning}')`,
  };
  try {
    const query = `select assignments.title,
                            assignments.id,
                            assignments.client_name,
                            assignments.status,
                            assignments.pitch,
                            assignments.brief_url,
                            assignments.published_url,
                            assignments.writer_email,
                            assignments.writer_payout,
                            assignments.writer_due_date,
                            assignments.writer_paid_date,
                            assignments.writer
                     from assignments
                            join writers on writers.id = ANY (assignments.writer)
                     where writers.email like $1 and (writers.status='Accepted' or writers.status='Potential Dev Writer') and (${article_query[type]})
                     and assignments.writer_due_date is not null
                     order by assignments.writer_due_date desc;`;
    const { rows } = await pool.query(query, [email]);

    return { data: rows, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e };
  }
};

export const getAvailableAssignments = async (email) => {
  try {
    const query = `select assignments.title,
                            assignments.id,
                            assignments.client_name,
                            assignments.status,
                            assignments.pitch,
                            assignments.brief_url,
                            assignments.writer_due_date,
                            assignments.writer,
                            assignments.writer_deliverables,
                            assignments.bonus,
                            assignments.content_categories,
                            assignments.content_types_names ,
                            string_agg(content_categories.name, ', ') as content_category_names,
                            your_requests.request_date,
                            your_requests.request_status
                     from assignments
                            left join content_categories on content_categories.id = ANY (assignments.content_categories)
                            left join (
                                select * from requests
                                where $2 = ANY (writer_email)
                            ) as your_requests on your_requests.id = ANY (assignments.requests)
                     where assignments.status like $1
                     and lower(assignments.content_types_names) not like $3
                     and assignments.writer_due_date < current_date + interval '45' day
                     and assignments.hide_in_portal = false
                     and assignments.writer = '{}'
                     group by assignments.id, your_requests.request_date, your_requests.request_status
                     order by assignments.writer_due_date asc;`;
    const { rows } = await pool.query(query, [
      "Assigning",
      email,
      "content transformation",
    ]);

    return { data: rows, error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e };
  }
};

export const getSingleAssignment = async (assignmentId, email) => {
  try {
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
                                  assignments.content_types_names,
                                  assignments.writer,
                                  assignments.bonus,
                                  assignments.audience,
                                  assignments.target_keyword,
                                  assignments.what_sets_the_company_apart,
                                  assignments.call_to_action,
                                  assignments.technical_level,
                                  assignments.tools_to_be_used,
                                  assignments.tools_to_be_excluded,
                                  assignments.competitors,
                                  assignments.mention_of_product,
                                  your_requests.request_date,
                                  your_requests.id as request_id,
                                  your_outreaches.reached_out_on,
                                  your_outreaches.id as outreach_id,
                                  your_outreaches.status as outreach_status,
                                  your_outreaches.expired
                           from assignments
                           left join (
                               select * from requests
                               where $2 = ANY (requests.writer_email)
                           ) as your_requests on your_requests.id = ANY (assignments.requests)
                           left join (
                               select * from outreach
                               where $2 = ANY (outreach.writer_email)
                           ) as your_outreaches on your_outreaches.id = ANY (assignments.outreach)
                           where assignments.id like $1;`;
    const { rows } = await pool.query(query, [assignmentId, email]);
    return { data: rows[0], error: null };
  } catch (e) {
    console.error(e);
    return { data: null, error: e };
  }
};
