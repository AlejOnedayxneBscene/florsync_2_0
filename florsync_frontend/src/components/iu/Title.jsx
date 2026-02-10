function Title({ text, className = "", ...rest }) {
  return (
    <h3
      className={`
        font-bold
        text-center
        text-[80px]
        p-2
        text-white
        tracking-wide
        drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]
        whitespace-nowrap
        ${className}
      `}
      style={{ fontFamily: '"Jockey One", sans-serif' }}
      {...rest}
    >
      {text}
    </h3>
  );
}

export default Title;
