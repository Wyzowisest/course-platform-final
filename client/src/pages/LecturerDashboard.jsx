import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import API from "../services/api";
import {
  CalendarDays,
  FileText,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function LecturerDashboard() {
  const { user, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: "", description: "", course: "", file: null });
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

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

  const myMaterials = useMemo(
    () => materials.filter((material) => material.uploadedBy?._id === user?._id),
    [materials, user?._id]
  );

  const courses = useMemo(
    () => [...new Set(myMaterials.map((material) => material.course))].sort(),
    [myMaterials]
  );

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...myMaterials]
      .filter((material) => {
        const matchesSearch =
          !normalizedSearch ||
          material.title.toLowerCase().includes(normalizedSearch) ||
          material.course.toLowerCase().includes(normalizedSearch) ||
          (material.description || "").toLowerCase().includes(normalizedSearch);

        const matchesCourse = !selectedCourse || material.course === selectedCourse;
        return matchesSearch && matchesCourse;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [myMaterials, searchTerm, selectedCourse]);

  const recentUploads = useMemo(() => filteredMaterials.slice(0, 4), [filteredMaterials]);
  const totalDownloads = useMemo(
    () => myMaterials.reduce((sum, material) => sum + (material.downloads || 0), 0),
    [myMaterials]
  );
  const mostDownloaded = useMemo(() => {
    if (myMaterials.length === 0) return null;
    return [...myMaterials].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0];
  }, [myMaterials]);

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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage("")} className="text-green-700 font-bold" type="button">x</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Materials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myMaterials.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Uploads created from your account</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Covered</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Distinct course spaces you manage</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDownloads}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all of your uploaded materials</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Material</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-semibold text-gray-900 truncate">
                {mostDownloaded ? mostDownloaded.title : "No uploads yet"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {mostDownloaded ? `${mostDownloaded.downloads || 0} downloads` : "Upload your first material to get started"}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-8 mb-8">
          <div className="space-y-8">
            <div>
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

            <Card>
              <CardHeader>
                <CardTitle>Manage Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by title, course, or description"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Courses</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                  <Button variant="outline" onClick={clearFilters}>Clear</Button>
                </div>

                <div className="space-y-4">
                  {filteredMaterials.map((material) => (
                    <div key={material._id} className="flex flex-col gap-4 p-4 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <FileText className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
                          <div>
                            <h3 className="font-medium text-gray-900">{material.title}</h3>
                            <p className="text-sm text-gray-600">{material.course}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {material.description || "No description added yet."}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMaterial(material._id)}
                          className="self-start"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Uploaded {formatDate(material.createdAt)}</span>
                        <span>{material.downloads || 0} downloads</span>
                        <span>{material.originalFilename}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredMaterials.length === 0 && (
                  <div className="text-center py-10">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No materials match your current filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentUploads.length > 0 ? recentUploads.map((material) => (
                  <div key={material._id} className="border rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-900">{material.title}</p>
                    <p className="text-xs text-gray-500">{material.course}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{formatDate(material.createdAt)}</span>
                      <span>{material.downloads || 0} downloads</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">Your latest uploads will appear here.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {courses.length > 0 ? courses.map((course) => {
                  const courseMaterials = myMaterials.filter((material) => material.course === course);
                  const courseDownloads = courseMaterials.reduce((sum, material) => sum + (material.downloads || 0), 0);

                  return (
                    <div key={course} className="border rounded-lg p-3">
                      <p className="font-medium text-sm text-gray-900">{course}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>{courseMaterials.length} materials</span>
                        <span>{courseDownloads} downloads</span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-500">Course breakdown will appear after your first upload.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
