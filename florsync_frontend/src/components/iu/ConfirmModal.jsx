import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const ConfirmModal = ({ open, onConfirm, onCancel, success }) => {
  // 🔹 Función wrapper para depuración
  const handleConfirmClick = () => {
    console.log("🚀 Botón 'Sí' clickeado - ejecutando onConfirm");
    if (onConfirm) onConfirm();
  };

  const handleCancelClick = () => {
    console.log("❌ Botón 'No' clickeado - cerrando modal");
    if (onCancel) onCancel();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl border border-gray-200 relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            {!success && (
              <>
                <div className="mb-4 text-lg font-semibold text-gray-800">
                  ¿Está seguro de realizar la venta?
                </div>
                <div className="flex justify-around mt-4">
                  <button
                    onClick={handleCancelClick}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    No
                  </button>
                  <button
                    onClick={handleConfirmClick}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Sí
                  </button>
                </div>
              </>
            )}

            {success === true && (
              <div className="flex flex-col items-center">
                <CheckCircle2 className="text-green-500 w-16 h-16 mb-4 animate-bounce" />
                <div className="text-xl font-bold text-gray-800">Venta realizada!</div>
              </div>
            )}

            {success === false && (
              <div className="flex flex-col items-center">
                <XCircle className="text-red-500 w-16 h-16 mb-4 animate-shake" />
                <div className="text-xl font-bold text-gray-800">
                  Error al realizar la venta
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
