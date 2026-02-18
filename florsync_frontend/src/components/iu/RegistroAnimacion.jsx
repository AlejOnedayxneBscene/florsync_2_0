import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const RegistroAnimacion = ({ success }) => {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      {success ? (
        <>
          <CheckCircle2 className="text-green-500 w-20 h-20 mb-2 animate-bounce" />
          <div className="text-xl font-bold text-gray-800">¡Proceso realizado con exito</div>
        </>
      ) : (
        <>
          <XCircle className="text-red-500 w-20 h-20 mb-2 animate-shake" />
          <div className="text-xl font-bold text-gray-800">Error al realizar proceso</div>
        </>
      )}
    </motion.div>
  );
};

export default RegistroAnimacion;
