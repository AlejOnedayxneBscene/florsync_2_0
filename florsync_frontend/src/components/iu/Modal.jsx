import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const Modal = ({ open, onClose, title, children, status }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg w-[420px] relative shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {/* Contenido principal */}
        {children}

        {/* Animación de registro */}
        <AnimatePresence>
          {status !== null && (
            <motion.div
              className="mt-4 flex flex-col items-center"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              {status === true && (
                <>
                  <CheckCircle2 className="text-green-500 w-16 h-16 mb-2 animate-bounce" />
                  <div className="text-lg font-bold text-gray-800">¡Registrado con éxito!</div>
                </>
              )}
              {status === false && (
                <>
                  <XCircle className="text-red-500 w-16 h-16 mb-2 animate-shake" />
                  <div className="text-lg font-bold text-gray-800">Error al registrar</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Modal;
