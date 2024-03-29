import Link from "next/link";
import { log } from "next-axiom";
import { v4 as uuidv4 } from "uuid";

export function Error({
  error = null,
  message = "Sorry, we couldn't load this page.",
  code = "500",
}) {
  return (
    <>
      {error ? (
        <section className="flex items-center h-full p-16">
          <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
            <div className="max-w-md text-center">
              <h2 className="mb-8 font-extrabold text-9xl dark:text-gray-600">
                <span className="sr-only">Error</span> {code}
              </h2>
              <p className="text-2xl font-semibold md:text-3xl m-5">
                {message}
              </p>
              <p>
                Please contact{" "}
                <a href="mailto:portal@draft.dev">portal@draft.dev</a>
              </p>
              <Link
                href={"/"}
                rel="noopener noreferrer"
                className="px-8 py-3 font-semibold rounded dark:bg-primary text-white block mt-4"
              >
                Back to homepage
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
