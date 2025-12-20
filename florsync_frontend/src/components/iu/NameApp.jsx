function NameApp({ text, className = "", ...rest }) {
  return (
    <h3
      className={`
        text-5xl 
        font-bold 
        text-center
        text-[#00DF82]
        p-6
        ${className}
      `}
      style={{ fontFamily: "'Kavoon', serif" }} // aplicamos la fuente
      {...rest} 
    >
      {text} 
    </h3>
  );
}

export default NameApp;
