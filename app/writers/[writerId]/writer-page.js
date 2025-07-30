"use client";
import React, { useEffect } from "react";
import { useWriter } from "../../../data/use-writer";
import Image from "next/legacy/image";

export default function WriterPage({ writerId }) {
  return <Writer writerId={writerId} />;
}

function Writer({ writerId }) {
  const { writer } = useWriter(writerId);
  const [photo, setPhoto] = React.useState("");

  const fetchPhoto = async () => {
    const photo = await fetch(`/api/writers/${writerId}/photo`)
    console.log(photo)
    setPhoto(await photo.text())
  }
  useEffect( () => {
    fetchPhoto()
  })
  return (
    <>
      <div className="flex justify-center mb-64 mt-10">
        <div className="max-w-4xl flex justify-center">
          <div className="card lg:card-side bg-base-100 shadow-xl">
            <div className="flex lg:block items-center justify-center">
              <figure className="h-[400px] w-[400px] rounded-full relative">
                <Image
                  src={photo}
                  alt={"Writer profile photo"}
                  layout="fill"
                />
              </figure>
            </div>

            <div className="card-body">
              <h2 className="card-title">
                {writer?.first_name} {writer?.last_name}
              </h2>
              <div>
                {writer?.location ? (
                  <div
                    className="tooltip tooltip-left mr-4"
                    data-tip="Location"
                  >
                    <span>🌍 {writer.location}</span>
                  </div>
                ) : (
                  ""
                )}
                {writer?.post_count > 5 ? (
                  <div
                    className="tooltip tooltip-left mr-4"
                    data-tip="This writer has written 5 or more articles for Draft.dev"
                  >
                    <span>📚 5+ Articles</span>
                  </div>
                ) : (
                  ""
                )}
              </div>
              <p>{writer?.bio}</p>

              <div className="card-actions justify-end">
                <p>
                  {writer?.website ? (
                    <span>
                      <a
                        href={writer?.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>{" "}
                    </span>
                  ) : (
                    ""
                  )}
                  {writer?.twitter_link ? (
                    <span>
                      <a
                        href={writer?.twitter_link}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Twitter
                      </a>{" "}
                    </span>
                  ) : (
                    ""
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
