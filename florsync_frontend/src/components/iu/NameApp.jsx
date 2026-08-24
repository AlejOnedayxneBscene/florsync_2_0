function NameApp({ text, className = "", ...rest }) {
  return (
    <h3
      className={`
        text-xl md:text-5xl
        font-bold
        text-center
        p-2 md:p-6
        bg-gradient-to-r
        from-[#00DF82]
        to-[#00B96B]
        bg-clip-text
        text-transparent
        ${className}
      `}
      style={{ fontFamily: "'Kavoon', serif" }}
      {...rest}
    >
      {text}
    </h3>
  );
}

export default NameApp;
