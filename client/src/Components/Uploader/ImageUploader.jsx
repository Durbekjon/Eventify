import { useState } from "react";
import instance from "../Inctance/Inctance";
import { TiDelete } from "react-icons/ti";

const ImageUploader = ({ setSelectedImgId, setSelectedAudioId, tittle, type,selectedFiles,setSelectedFiles }) => {

  const handleFileChange = async (event) => {
    const formData = new FormData();
    const file = event.target.files[0]; // Using 'file' for both images and audio

    if (file) {
      formData.append("file", file);
      try {
        const token = localStorage.getItem("token");
        const response = await instance.post("/file/create", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response:", response);
        console.log("Response data:", response.data);
        
        if (type === 'imageUpload') {
          setSelectedImgId((prevImgs) => [...prevImgs, response.data.file._id]);
          setSelectedFiles((prevFiles) => [...prevFiles, response.data.file]); // Update selected files
        } else if (type === 'audioUpload') {
          setSelectedAudioId((prevAudioIds) => [...prevAudioIds, response.data.file._id]);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };
  async function deleteImg(file_id) {
    console.log("Deleting file with ID:", file_id);
    try {
      const token = localStorage.getItem("token");
      const response = await instance.post(
        "/file/delete",
        { file_id: [file_id] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Delete response:", response.data);
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  }
  const handleDeleteImg = (id) => {
    // Optimistically remove the image from the UI
    const newSelectedImg = selectedFiles.filter((img) => img._id !== id);
    console.log([newSelectedImg]);
    setSelectedFiles(newSelectedImg);

    // Call the API to delete the image from the server
    deleteImg(id).catch((error) => {
      console.error("Error deleting image:", error);
      // If deletion fails, revert the UI change (optional)      // You could also show an error message here
    });
  };
  // console.log(selectedFiles);
  return (
    <div>
      <label className="block text-gray-700 font-medium">
        {tittle}
      </label>
      <div className="flex items-center mt-[20px]">
        <div
          className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer"
          onClick={() => document.querySelector(`input[name="${type}"]`).click()}
        >
          <div className="text-center">
            <span className="text-2xl font-bold">+</span>
            <input
              name={type}
              type="file"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md hidden"
              onChange={handleFileChange}
            />
            <p>Upload</p>
          </div>
        </div>

        <div className="flex gap-[20px] ml-[20px]">
          {selectedFiles?.map((file) => (
            <div key={file._id} className="relative">
              {type === 'imageUpload' && (
                <div>
                <TiDelete className="absolute text-white text-[24px] cursor-pointer right-0" onClick={(e)=>handleDeleteImg(file._id)} />
                <img
                  src={`http://localhost:8000/${file.filename}`}
                  alt="Selected"
                  className="w-32 h-32 object-cover rounded-lg"
                  />
                  </div>
              )}
              {type === 'audioUpload' && (
                <audio controls>
                  <source src={`http://localhost:8000/${file.filename}`} />
                  Your browser does not support the audio tag.
                </audio>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;

