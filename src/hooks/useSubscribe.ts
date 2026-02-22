import { useState } from "react";
import axios from "axios";

const useSubscribe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const sendSubscribeEmail = async ({ gcode, emailid }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post("https://open.glancery.com/api/v1/glance/subscribe", {
        gcode,
        emailid,
      });

      if (response.status === 200 && response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || "Failed to send subscribe email.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return { sendSubscribeEmail, loading, error, success };
};

export default useSubscribe;