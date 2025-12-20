function Title({ text, className = "", ...rest }) {
  return (
    <h2
      className={` 
        font-bold 
        text-right
        text-[80px]
        font-jockey
        ${className}`

    }
     style={{ fontFamily: '"Jockey One", sans-serif' }}
      {...rest} 
    >
      {text} 
    </h2>
  );
}

export default Title;
