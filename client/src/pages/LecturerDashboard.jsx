import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import API from "../services/api";
import { Upload, FileText, Trash2, Plus } from "lucide-react";

export default function LecturerDashboard() {
  const { user, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "", course: "", file: null });
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await API.get("/materials");
      setMaterials(res.data);
    } catch (err) {
      console.error("Failed to fetch materials", err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("title", uploadForm.title);
    formData.append("description", uploadForm.description);
    formData.append("course", uploadForm.course);
    formData.append("file", uploadForm.file);

    try {
      await API.post("/materials", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadForm({ title: "", description: "", course: "", file: null });
      setShowUpload(false);
      setSuccessMessage("Material uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchMaterials();
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const deleteMaterial = async (id) => {
    try {
      await API.delete(`/materials/${id}`);
      fetchMaterials();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lecturer Dashboard</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm sm:text-base text-gray-700 hidden sm:inline">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-green-700 font-bold">×</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{[...new Set(materials.map(m => m.course))].length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Downloads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.reduce((sum, m) => sum + (m.downloads || 0), 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <Button onClick={() => setShowUpload(!showUpload)} className="mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Upload New Material
          </Button>

          {showUpload && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Material</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Input
                      id="course"
                      value={uploadForm.course}
                      onChange={(e) => setUploadForm({ ...uploadForm, course: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Materials List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {materials.map((material) => (
                <div key={material._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium">{material.title}</h3>
                      <p className="text-sm text-gray-600">{material.course}</p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMaterial(material._id)}
                    className="self-start sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}