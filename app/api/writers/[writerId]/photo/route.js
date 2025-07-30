import { withAxiom } from "next-axiom";
import { NextResponse } from "next/server";
import { getWriterPhotoUrl } from "../../../../../functions/writers";

export const GET = withAxiom(async (req, { params }) => {
  const writerId = params.writerId;
  const result = await getWriterPhotoUrl(writerId);

  return new NextResponse(result);
});
