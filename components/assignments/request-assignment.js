import {assignmentStatuses} from "../../constants/assignment-statuses";
import {useEffect, useState} from "react";

export default function RequestAssignment({assignment, userData}) {
    const [disabled, setDisabled] = useState(false);
    const [message, setMessage] = useState(false);

    // Allow writers to request an assignment
    const request = async (e) => {
        e.preventDefault();
        setDisabled(true);
        setMessage(false);
        fetch("/api/assignments/" + assignment.id + "/request", {
            method: "POST",
            body: JSON.stringify({email: userData.email}),
        })
            .then((response) => {
                if (response.ok) {
                    setMessage({
                        body: "Success! Your request has been submitted. You should hear back within 3 days.",
                        type: "success",
                    });
                    setDisabled(true);
                } else {
                    throw new Error("Invalid response from backend");
                }
            })
            .catch((error) => {
                setMessage({
                    body: "Whoops, something went wrong. Please reach out to editor@draft.dev to manually request this assignment.",
                    type: "error",
                });
                console.error(error);
                setDisabled(false);
            });
    };

    useEffect(() => {
        if (!assignment.request_date && userData && userData.writer_at_max_requests[0] === "1") {
            setMessage({
                body: "It looks like you've hit your request limit. New writers are typically limited to 5 open requests, but you can reach out to us if you'd like to have this limit lifted.",
                type: "error",
            });
        }
    }, [userData, assignment]);


    return (
        <div className="assignment-actions">
            {assignment.status === assignmentStatuses.assigning && assignment.writer_email.length === 0 ? (
                <form className="pure-form" onSubmit={request}>
                    <button className="pure-button button-success" type="submit" disabled={disabled || assignment.request_date || !userData || userData.writer_at_max_requests[0] === "1"}>
                        {assignment.request_date ? (' ✔ Request Submitted️') : ('Request Assignment')}
                    </button>
                    {message ? (
                        <p className={message.type}>{message.body}</p>
                    ) : null}
                </form>
            ) : (
                ""
            )}
        </div>
    );
}
