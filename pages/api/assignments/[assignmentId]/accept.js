import { getSingleAssignment, accept } from "../../../../functions/assignments";
import { requireAuth, users } from "@clerk/nextjs/api";
import { getCurrentWriter } from "../../../../functions/writers";
import { assignmentStatuses } from "../../../../constants/assignment-statuses";

const acceptAssignment = requireAuth(async (req, res) => {
  const { assignmentId } = req.query;
  const { userId } = req.auth;

  const user = await users.getUser(userId);
  const assignment = await getSingleAssignment(assignmentId);
  const writer = await getCurrentWriter(user.emailAddresses[0].emailAddress);

  if (writer.error || assignment.error) {
    return res.status(500).send("Server error");
  }
  if (!writer.data || !assignment.data)
    return res.status(404).send("Not found");

  if (assignment.data.writer[0] !== writer.data.id) {
    return res
      .status(403)
      .json({ error: "This assignment is not assigned to you" });
  }

  if (assignment.data.status !== assignmentStatuses.assigning) {
    return res
      .status(403)
      .json({ error: "This article is not in the assigning stage" });
  }
  try {
    // Update writer submitted date
    await accept(assignmentId);

    res.status(200).send({ assignmentId });
  } catch (e) {
    // Handle any errors
    console.error(e);
    res.status(500).send("Server error");
  }
});

export default acceptAssignment;
