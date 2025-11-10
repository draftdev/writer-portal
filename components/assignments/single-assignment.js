import * as dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import * as utc from "dayjs/plugin/utc";
import { truncate } from "lodash";
import AcceptAssignment from "../../components/assignments/accept-assignment";
import RequestAssignment from "../../components/assignments/request-assignment";
import { assignmentStatuses } from "../../constants/assignment-statuses";
import SubmitAssignment from "../../components/assignments/submit-assignment";
import AssignmentHeader from "../../components/assignments/assignment-header";
import { useWriter } from "../../data/use-writer";
import { useSingleAssignment } from "../../data/use-assignments";
import { Error } from "../error";
import AssignmentOutreach from "./assignment-outreach";
import Markdown from "react-markdown";

dayjs.extend(localizedFormat);
dayjs.extend(utc);

const getAssignmentPayout = (deliverables, writer_rate, bonus = 0) => {
  let word_count = deliverables
    .map((item) => {
      return item.match(/~(\d+) word article/);
    })
    .filter((item) => item != null);

  if (word_count.length > 0) {
    const normalized_count = Number(word_count[0][1]) <= 2000 ? 1500 : 2500; // 1500 words up to 2000 words. 2500 words for 2500+
    const payout =
      normalized_count <= 1500
        ? Number(writer_rate)
        : Math.floor(
            Number(writer_rate) +
              (((normalized_count - 1500) * Number(writer_rate)) / 1500) * 0.5,
          );
    return payout + Number(bonus);
  } else {
    return null;
  }
};

export default function SingleAssignment({ assignmentId }) {
  const {
    writer,
    isLoading: writerIsLoading,
    isError: writerIsError,
    mutate: mutateWriter,
  } = useWriter("me");
  const {
    assignment,
    isLoading: assignmentIsLoading,
    isError: assignmentIsError,
    mutate: mutateAssignment,
  } = useSingleAssignment(assignmentId);
  console.log(writerIsLoading);
  console.log(assignmentIsLoading);
  if (writerIsLoading || assignmentIsLoading) {
    return (
      <div>
        <div className="overflow-x-auto animate-pulse  p-2 mt-4">
          <h1 className="text-3xl">
            <div className="h-4 bg-gray-200 rounded-full dark:bg-gray-700 w-96 m-4"></div>
          </h1>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Client name
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Pitch
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Outline
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 m-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-24 m-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-64 m-4"></div>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-8 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Published URL
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-24 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Due Date
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-8 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Deliverables
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-16 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Audience
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-16 m-4"></div>
          <h3 className="uppercase bg-gray-100 text-gray-400 my-2 font-light">
            Content Type
          </h3>
          <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-16 m-4"></div>
        </div>
      </div>
    );
  }

  if (writerIsError || assignmentIsError) {
    return <Error />;
  }
  const belongsToCurrentUser = () => {
    return (
      writer &&
      assignment.writer_email &&
      assignment.writer_email.length > 0 &&
      assignment.writer_email[0] &&
      assignment.writer_email[0] === writer.email
    );
  };

  const handleAccept = () => {
    mutateAssignment({ ...assignment, status: assignmentStatuses.writing });
    mutateWriter({
      ...writer,
      current_assignments_count: (
        Number(writer.current_assignments_count) + 1
      ).toString(),
    });
  };

  const handleSubmit = () => {
    mutateAssignment({ ...assignment, status: assignmentStatuses.tech_review }, {revalidate: false});
    mutateWriter({
      ...writer,
      current_assignments_count: (
        Number(writer.current_assignments_count) - 1
      ).toString(),
    });
  };

  const handleRequest = (requestId) => {
    // Not revalidating because Sequin's sync delays. We're not returning all the requests
    // in the SQL, so it becomes difficult to update the assignment record via Sequin proxy
    // We simply assume things went well.
    mutateAssignment(
      { ...assignment, request_id: requestId },
      { revalidate: false },
    );
    mutateWriter(
      {
        ...writer,
        pending_requests_count: (
          Number(writer.pending_requests_count) + 1
        ).toString(),
      },
      { revalidate: false },
    );
  };

  const handleUnRequest = () => {
    // Not revalidating because Sequin's sync delays. We're not returning all the requests
    // in the SQL, so it becomes difficult to update the assignment record via Sequin proxy
    // We simply assume things went well.
    mutateAssignment(
      { ...assignment, request_id: null },
      { revalidate: false },
    );
    mutateWriter(
      {
        ...writer,
        pending_requests_count: (
          Number(writer.pending_requests_count) - 1
        ).toString(),
      },
      { revalidate: false },
    );
  };

  const handleOutreachAccept = (outreachId) => {
    // Here we can allow revalidation because the calculations are done in SQL
    mutateAssignment({ ...assignment, outreach_status: "Accepted" });
    mutateWriter({
      ...writer,
      pending_outreaches_count: (
        Number(writer.pending_outreaches_count) - 1
      ).toString(),
    });
  };

  const handleOutreachReject = () => {
    // Here we can allow revalidation because the calculations are done in SQL
    mutateAssignment({ ...assignment, outreach_status: "Rejected" });
    mutateWriter({
      ...writer,
      pending_outreaches_count: (
        Number(writer.pending_outreaches_count) - 1
      ).toString(),
    });
  };
  return (
    <div className="p-4 relative">
      <AssignmentHeader assignment={assignment} writerEmail={writer.email} />
      <div className="overflow-x-auto p-2 mt-4">
        <h1 className="text-3xl">{assignment.title}</h1>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Client Name
        </h3>
        <p>{assignment.client_name}</p>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Pitch
        </h3>
        <p>{assignment.pitch}</p>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Outline
        </h3>
        <div className="prose">
          <Markdown>{assignment.outline}</Markdown>
        </div>
        {assignment.published_url ? (
          <>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Published URL
            </h3>
            <p>{assignment.published_url}</p>
          </>
        ) : null}
        {belongsToCurrentUser() ? (
          <>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Brief URL
            </h3>
            <p>
              <a
                className="link"
                target="_blank"
                rel="noreferrer"
                href={assignment.brief_url}
              >
                {truncate(assignment.brief_url, { length: 55 })}
              </a>
            </p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Status
            </h3>
            <p>{assignment.status}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Writer Assigned
            </h3>
            <p>{assignment.writer_email}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Target keyword(s)
            </h3>
            <p>{assignment.target_keyword || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              What problem is {assignment.client_name} trying to solve? What
              sets them apart?
            </h3>
            <p>{assignment.what_sets_the_company_apart || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Include a call to action?
            </h3>
            <p>{assignment.call_to_action || "No"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Tools that should be used
            </h3>
            <p>{assignment.tools_to_be_used || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Tools that should not be used
            </h3>
            <p>{assignment.tools_to_be_excluded || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Competitors of {assignment.client_name}
            </h3>
            <p>{assignment.competitors || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              How should the product(s) of {assignment.client_name} be
              mentioned?
            </h3>
            <p>{assignment.mention_of_product || "N/A"}</p>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Writer Assigned
            </h3>
            <p>{assignment.writer_email || "N/A"}</p>
          </>
        ) : null}
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Due Date
        </h3>
        <p>{dayjs(assignment.writer_due_date).utc().format("LL")}</p>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Deliverables
        </h3>
        <p>{assignment.writer_deliverables.join(", ")}</p>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Audience
        </h3>
        <p>{assignment.audience}</p>
        <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
          Content Type
        </h3>
        <p>{assignment.content_types_names}</p>
        {!belongsToCurrentUser() ? (
          <>
            <h3 className="uppercase bg-gray-100 text-gray-400 my-4 font-light">
              Payout
            </h3>
            <p>
              ${" "}
              {getAssignmentPayout(
                assignment.writer_deliverables,
                writer.rate,
                assignment.bonus,
              )}
            </p>
          </>
        ) : null}
        <AssignmentOutreach
          assignment={assignment}
          userData={writer}
          handleAccept={handleOutreachAccept}
          handleReject={handleOutreachReject}
        />
        <RequestAssignment
          assignment={assignment}
          userData={writer}
          handleRequest={handleRequest}
          handleUnRequest={handleUnRequest}
        />

        {belongsToCurrentUser() ? (
          <div className="mt-8">
            <AcceptAssignment
              assignment={assignment}
              handleAccept={handleAccept}
            />
            <SubmitAssignment
              assignment={assignment}
              handleSubmit={handleSubmit}
            />
          </div>
        ) : null}
        <p className="my-4">
          Have a question about this assignment? Take a look at the{" "}
          <a
            href="https://www.notion.so/draftdev/Writer-FAQ-e52b75bd31b44fc0b21c884083c9ed15"
            className={"text-success underline"}
          >
            Writer FAQ
          </a>{" "}
          or email{" "}
          <a
            href="mailto:editor@draft.dev"
            className={"text-success underline"}
          >
            editor@draft.dev
          </a>
        </p>
      </div>
    </div>
  );
}
