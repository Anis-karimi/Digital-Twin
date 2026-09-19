import "@/styles/Allpages.css";

export const MessageBubble = ({ text, time, isMine, classNames }) => {
  const isPersian = /[\u0600-\u06FF]/.test(text);

  const dir = isPersian ? "rtl" : "ltr";

  const textClass = isPersian ? "text-right" : "text-left";

  // تبدیل Markdown به متن بولد
  const formatText = (text) => {
    // حذف ستاره‌های مربوط به bullet list
    text = text.replace(/(^|\n)\s*\\?\*\s+/g, "$1");

    const paragraphs = text.split(/\n+/);

    return paragraphs.map((paragraph, index) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);

      return (
        <div key={index} className={index > 0 ? "mt-2" : ""}>
          {parts.map((part, partIndex) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
            }

            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  return (
    <div
      className={isMine ? classNames.myMessageRow : classNames.otherMessageRow}
    >
      <div className={isMine ? classNames.myBubble : classNames.otherBubble}>
        <p className={`${classNames.messageText} ${textClass}`} dir={dir}>
          {formatText(text)}
        </p>

        <div className="flex justify-end mt-1">
          <span className={classNames.messageTime}>{time}</span>
        </div>
      </div>
    </div>
  );
};
