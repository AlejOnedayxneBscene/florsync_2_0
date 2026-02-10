import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import SlickSlider from "react-slick";

export default function Carousel() {
   const settings = {
    dots: true,             // Muestra los puntos debajo
    arrows: false,          // Oculta las flechas laterales
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,

  customPaging: i => (
  <div></div> // el estilo se aplica desde Tailwind/CSS
),

  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10, h-10">
      <SlickSlider {...settings}>
        <div>
          <img 
            src="/images/girasoles.jpeg" 
            alt="Imagen 1" 
            className="w-full max-h-[400px] md:max-h-[820px] rounded-lg"
          />
        </div>
        <div>
          <img 
            src="/images/ramo_rosas_rosadas.jpeg" 
            alt="Imagen 2" 
            className="w-full max-h-[400px] md:max-h-[820px] rounded-lg"
          />
        </div>
        <div>
          <img 
            src="/images/corazon_de_rosas.jpeg" 
            alt="Imagen 3" 
            className="w-full max-h-[400px] md:max-h-[820px] rounded-lg"
          />
        </div>
        <div>
          <img 
            src="/images/bucket.png" 
            alt="Imagen 4" 
            className="w-full max-h-[600px] md:max-h-[820px] rounded-lg"
          />
        </div>
      </SlickSlider>
    </div>
  );
}
