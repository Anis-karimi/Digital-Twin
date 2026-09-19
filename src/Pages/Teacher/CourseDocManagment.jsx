import { useRef, useState, useEffect } from "react";
import Trash_Full from "@/assets/icons/Trash_Full.svg?react";
import File_Add from "@/assets/icons/File_Add.svg?react"
import { ArrowLeft } from "lucide-react";
import "@/styles/Allpages.css";
import "@/styles/fonts.css"
import { useNavigate, useParams } from "react-router-dom";
import { BACKEND_URL } from "@/Services/BackendConfige";
import { courses } from "@/data/courses";

export const TeacherCourseDoc = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate()
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [courseTitle, setCourseTitle] = useState("");

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const course = courses.find(
      (course) => course.id === id
    );

    if (course) {
      setCourseTitle(course.title);
    }
  }, [id]);


  const loadDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/contexts`);
      const data = await res.json();

      const apiFiles = data.map((item, index) => ({
        id: Date.now() + index,
        name: item,
        deleteIcon: Trash_Full,
      }));

      setFiles(apiFiles);

    } catch (error) {
      console.error("Loading documents failed:", error);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;


    try {

      // ارسال فایل به API
      for (const file of selectedFiles) {

        const formData = new FormData();
        formData.append("file", file);


        const response = await fetch(`${BACKEND_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });


        if (!response.ok) {
          throw new Error("Upload failed");
        }

      }


      // همان ساختار قبلی خودت حفظ می‌شود
      const nextFiles = selectedFiles.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        deleteIcon: Trash_Full,
      }));


      setFiles((prev) => [...prev, ...nextFiles]);


    } catch (error) {

      console.error("Upload error:", error);

    }


    event.target.value = "";
  };


  const handleDelete = async (file) => {

    try {

      await fetch(`${BACKEND_URL}/api/contexts/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contexts: [file.name]
        })
      });


      setFiles(prev =>
        prev.filter(item => item.id !== file.id)
      );


    } catch (error) {

      console.error("Delete failed:", error);

    }

  };

  return (
    <main className="bg-[#f1f0f0] dark:bg-neutral-scale1400 overflow-hidden w-full md:w-[360px] h-dvh mx-auto flex flex-col">
      <header className="w-full h-[65px] -mt-px flex">
        <div className="w-full h-[65px] relative flex bg-primery-700 dark:bg-neutral-scale1300 border-b dark:border-neutral-scale1000">
          <button
            onClick={() => navigate(-1)}
            type="button"
            aria-label="بازگشت"
            className="text-white absolute top-1/2 -translate-y-1/2 left-[15px] w-6 h-6 cursor-pointer"
          >
            <ArrowLeft className="!w-6 !h-6" />
          </button>

          <h1 className="absolute top-1/2 -translate-y-1/2 left-[59px] fa-title-1 text-white text-center whitespace-nowrap [direction:rtl]">
            {courseTitle}
          </h1>
        </div>
      </header>

      <section
        className="w-full flex-1 min-h-0 mt-[15px] mb-[20px]"
        aria-label="Course documents"
      >
        <div className="w-full h-full px-3.5 overflow-y-auto overflow-x-hidden">
          <div className="relative mt-[5px] w-full bg-neutral-scale70 dark:bg-neutral-scale1300 border border-neutral-scale100 dark:border-neutral-scale1100 rounded-[13px] py-[25px]">
            <div className="inline-flex items-center gap-[5px] absolute top-4.5 left-[15px]">
              <button
                type="button"
                onClick={handleUploadClick}
                className="inline-flex items-center gap-[5px] cursor-pointer"
                aria-label="Upload New File"
              >
                <File_Add className="!relative !w-7 !h-7 text-primery-800 dark:text-neutral-scale70" />

                <span className="relative w-fit fa-body-medium text-primery-800 dark:text-neutral-scale70 whitespace-nowrap">
                  Upload New File
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                aria-label="Choose files to upload"
              />
            </div>

            <div className="mt-[50px] w-full px-5 pb-4 min-h-0 flex-1 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`flex w-full items-center justify-between ${
                    index === 0 ? "" : "mt-[15px]"
                  }`}
                >
                  {/* Document name */}
                  <a
                    href={`${BACKEND_URL}/tmp/${encodeURIComponent(file.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="en-body text-neutral-scale1800 dark:text-neutral-scale70 whitespace-nowrap cursor-pointer"
                  >
                    {file.name}
                  </a>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(file)}
                    aria-label={`Delete ${file.name}`}
                    className="shrink-0 w-[20px] h-[20px] flex items-center justify-center cursor-pointer"
                  >
                    <Trash_Full className="w-[20px] h-[20px]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

