import React, { useContext, useState } from 'react'
import { AuthContext } from '../../Auth/AuthContext';
const Verification = () => {
    const token = localStorage.getItem('token')
  const [credentials, setCredentials] = useState({otp:'',token:token});
  const { verification, loading } = useContext(AuthContext)
  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verification(credentials);
    // Reset form fields using setCredentials
    setCredentials({ otp:''});
  };
  return (
    <div className="bg-gray h-[100vh] flex justify-center items-center">
    <div className="bg-darkBlue w-[100%] max-w-[638px] h-[full] rounded-[28px] m-auto">
        <div className="py-[51px] px-[62px]">
        <h1 className="text-[36px] font-[700] text-textGray">Confirm email</h1>
        <div className="inputs mt-[93px]">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="otp"
              className="text-textGray text-[21px] font-[700]"
            >
              Email address:
            </label>
            <div className="mt-[11px]">
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={credentials.otp}
                onChange={handleChange}
                placeholder="xx-xx-xx"
                className="rounded-[8px] max-w-[514px] w-[100%] h-[86px] bg-[#122434] placeholder:text-[21px] text-[21px] text-textGray font-[700] pl-[29.5px]"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="h-[86px] w-[100%] text-center bg-yellow rounded-[8px] text-[21px] font-[700] text-[#C4E1FE]"
            >
              {!loading ? "Verify" : "Loading..."}
            </button>
          </div>
        </form>
        </div>
        </div>
    </div>
    </div>
  )
}

export default Verification