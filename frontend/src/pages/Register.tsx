import { useState } from "react";
import axios from "../api/axios";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e: any) => {
    e.preventDefault();
    await axios.post("/auth/register", null, {
      params: { email, password },
    });
    alert("Registered!");
  };

  return (
    <form onSubmit={submit}>
      <input onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button>Register</button>
    </form>
  );
}
