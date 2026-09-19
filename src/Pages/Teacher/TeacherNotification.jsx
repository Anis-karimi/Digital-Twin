import { ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import X from "@/assets/icons/X.svg?react";

export const TeacherNotification = () => {
  const navigate = useNavigate();

  const initialJoinRequests = useMemo(
    () => [
      {
        id: 1,
        name: "Anis Karimi",
        subject: "OS",
        avatarClassName: "bg-error-100",
        icon: X,
        iconAlt: "Remove request",
      },
      {
        id: 2,
        name: "محمد رسولی",
        subject: "امنیت",
        avatarClassName: "bg-warning-100",
        icon: X,
        iconAlt: "Remove request",
      },
      {
        id: 3,
        name: "ملیکا یزدان پناه",
        subject: "هوش مصنوعی",
        avatarClassName: "bg-success-100",
        icon: X,
        iconAlt: "Remove request",
      },
    ],
    [],
  );

  const [joinRequests, setJoinRequests] = useState(initialJoinRequests);

  const handleAccept = (id) => {
    setJoinRequests((prev) => prev.filter((request) => request.id !== id));
  };

  const handleRemove = (id) => {
    setJoinRequests((prev) => prev.filter((request) => request.id !== id));
  };

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 w-full md:w-[360px] h-dvh mx-auto flex flex-col overflow-hidden">
      {/* Header */}
      <header className="w-full h-[65px] flex shrink-0">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label="Go back"
            className="text-white absolute left-[15px] top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center"
          >
            <ArrowLeft className="!w-6 !h-6" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-16 en-title-1 text-[#f7f7f7] text-center whitespace-nowrap">
            Notifications
          </h1>
        </div>
      </header>

      {/* Content */}
      <section
        aria-label="Notifications content"
        className="w-full flex-1 min-h-0 mt-[10px] mb-[20px] px-3.5 overflow-y-auto overflow-x-hidden"
      >
        <div className="w-full flex flex-col gap-2.5">
          {/* Join Requests */}
          <section
            aria-labelledby="join-requests-heading"
            className="w-full h-[200px] shrink-0 relative flex flex-col items-start gap-2.5 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden"
          >
            <h2
              id="join-requests-heading"
              className="text-left relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70 "
            >
              Your Join Requests
            </h2>

            <div className="absolute top-8 left-0 w-full h-[3px] bg-neutral-scale200" />

            <ul className="list-none m-0 p-0 w-full">
              {joinRequests.map((request, index) => {
                const topPositions = [
                  "top-[50px]",
                  "top-[100px]",
                  "top-[150px]",
                ];

                return (
                  <li
                    key={request.id}
                    className={`absolute left-[15px] right-[15px] h-9 ${
                      topPositions[index] || "top-[41px]"
                    }`}
                  >
                    {/* Name */}
                    <div
                      className="absolute top-[5px] left-11 w-[59px] fa-caption-4 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap [direction:rtl]"
                      dir="rtl"
                    >
                      {request.name}
                    </div>

                    {/* Avatar */}
                    <div
                      className={`${request.avatarClassName} absolute top-px left-px w-9 h-9 rounded-[52px] rotate-[-180deg] aspect-[1]`}
                      aria-hidden="true"
                    />

                    {/* Subject */}
                    <div
                      className="absolute top-[19px] left-12 w-[47px] fa-caption-5 text-neutral-scale1800 dark:text-neutral-scale70 text-center whitespace-nowrap [direction:rtl]"
                      dir="rtl"
                    >
                      {request.subject}
                    </div>

                    {/* Accept */}
                    <button
                      type="button"
                      onClick={() => handleAccept(request.id)}
                      aria-label={`Accept join request from ${request.name}`}
                      className="flex w-[60px] h-5 items-center justify-center gap-2.5 px-2 py-px absolute top-[7px] right-[50px] bg-warning-100 rounded"
                    >
                      <span className="relative w-fit mt-[-1px] fa-caption-2 text-black text-center whitespace-nowrap">
                        Accept
                      </span>
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemove(request.id)}
                      aria-label={`Remove join request from ${request.name}`}
                      className="absolute top-[10px] right-2 w-3 h-3 flex items-center justify-center "
                    >
                      <X className="text-red-500" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Messages */}
          <section className="w-full h-[65px] shrink-0 relative flex flex-col items-start gap-3 px-[15px] py-2.5 bg-white dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] overflow-hidden">
            <h2 className="text-left relative self-stretch mt-[-1px] en-caption-3 text-primery-800 dark:text-neutral-scale70">
              Messages
            </h2>

            <div className="absolute top-8 left-0 w-full h-[3px] bg-neutral-scale200" />
          </section>
        </div>
      </section>
    </main>
  );
};
