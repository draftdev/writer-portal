import {useState, useEffect} from "react";
import * as dayjs from "dayjs";
import * as localizedFormat from "dayjs/plugin/localizedFormat";
import {truncate} from "lodash";
import AcceptAssignment from "../../components/assignments/accept-assignment";
import RequestAssignment from "../../components/assignments/request-assignment";
import {assignmentStatuses} from "../../constants/assignment-statuses";
import SubmitAssignment from "../../components/assignments/submit-assignment";
import AssignmentHeader from "../../components/assignments/assignment-header";
// import ReactMarkdown from 'react-markdown/react-markdown.min';
import dynamic from 'next/dynamic'
const ReactMarkdown= dynamic(() => import('react-markdown'),{ ssr: false })
dayjs.extend(localizedFormat);

export default function SingleAssignment({assignmentId}) {
    const [assignment, setAssignment] = useState(null);
    const [userData, setUserData] = useState(null);
    
    const getAssignment = () => {
        fetch(`/api/assignments/${assignmentId}`)
        .then(resp => resp.json())
        .then(json => setAssignment(json))
        .catch(e => {
            console.error(e);
            setAssignment(false);
        });
    }

    const getUserData = () => {
        fetch(`/api/writers/me`)
            .then(resp => resp.json())
            .then(json => setUserData(json))
            .catch(e => {
                console.error(e);
                setUserData(false);
            });
    };

    const belongsToCurrentUser = () => {
        return userData && assignment.writer_email &&
            assignment.writer_email.length > 0 &&
            assignment.writer_email[0] &&
            assignment.writer_email[0] === userData.email
    }

    const handleAccept = () => {
        setAssignment({
            ...assignment,
            status: assignmentStatuses.writing,
        });
    };

    const handleSubmit = () => {
        setAssignment({
            ...assignment,
            status: assignmentStatuses.ready_for_editing,
        });
    };

    useEffect(() => {
        if (assignmentId) {
            getAssignment();
            getUserData();
        }
    }, [assignmentId]);

    return (
      <div>
        {assignment ? (
          <>
          <AssignmentHeader assignment={assignment}/>
          <table className="pure-table">
              <tbody>
              <tr>
                  <th>Title</th>
                  <td>{assignment.title}</td>
              </tr>
              <tr>
                  <th>Pitch</th>
                  <td>{assignment.pitch}</td>
              </tr>
              {belongsToCurrentUser() ? (
                  <tr>
                      <th>Brief URL</th>
                      <td style={{overflow: "hidden", whiteSpace: "nowrap"}}>
                          <a href={assignment.brief_url} target="_blank">
                              {truncate(assignment.brief_url, {length: 55})}
                          </a>
                      </td>
                  </tr>) : null}
                  <tr>
                    <th>Outline</th>
                    <td>
                      <ReactMarkdown children={assignment.outline} />
                    </td>
                  </tr>
              {assignment.published_url ? (
                  <tr>
                      <th>Published URL</th>
                      <td style={{overflow: "hidden", whiteSpace: "nowrap"}}>
                          <a href={assignment.published_url} target="_blank">
                              {truncate(assignment.published_url, {length: 55})}
                          </a>
                      </td>
                  </tr>
              ) : null}
              {belongsToCurrentUser() ? (
                  <>
                      <tr>
                          <th>Writer Assigned</th>
                          <td>{assignment.writer_email}</td>
                      </tr>
                      <tr>
                          <th>Pay Rate</th>
                          <td>${assignment.writer_payout}</td>
                      </tr>
                  </>) : null}
              <tr>
                  <th>Due Date</th>
                  <td>{dayjs(assignment.writer_due_date).format("LL")}</td>
              </tr>
              <tr>
                  <th>Deliverables</th>
                  <td>{assignment.writer_deliverables.join(", ")}</td>
              </tr>
              </tbody>
          </table>
          <RequestAssignment
              assignment={assignment}
              userData={userData}
          />
          {belongsToCurrentUser() ? (
              <>
                  <AcceptAssignment
                      assignment={assignment}
                      handleAccept={handleAccept}
                  />
                  <SubmitAssignment
                      assignment={assignment}
                      handleSubmit={handleSubmit}
                  />
              </>
          ) : (null)}
          <p>
              Have a question about this assignment? Email{" "}
              <a href="mailto:editor@draft.dev">editor@draft.dev</a>
          </p>
          </>
        ) : assignment === false ? (
            <p>Assignment not found.</p>
        ) : (
            <p>Loading assignment...</p>
        )}
      </div>
    );
}
