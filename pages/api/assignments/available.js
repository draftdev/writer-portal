import { requireAuth, users } from "@clerk/nextjs/api";
import { getAvailableAssignments } from "../../../functions/assignments";

export default requireAuth(
  withAxiom(async (req, res) => {
    if (req.method !== "GET") return res.status(400).send("Method not allowed");
    const { userId } = req.auth;
    const user = await users.getUser(userId);
    const result = await getAvailableAssignments(
      user.emailAddresses[0].emailAddress
    );

    if (!result.error) {
      if (!result.data) {
        req.log.error(
          `User ${user.emailAddresses[0].emailAddress} has no available assignments`,
          { user: user.emailAddresses[0].emailAddress }
        );
        return res.status(404).send("Not found");
      }
      return res.status(200).send(result.data);
    }
    req.log.error(result.error, { user: user.emailAddresses[0].emailAddress });
    return res.status(500).send(result.error);
  })
);
