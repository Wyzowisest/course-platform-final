import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../contexts/AuthContext";
import API from "../services/api";
import {
  BookOpen,
  CalendarDays,
  Download,
  FileText,
  Filter,
  Search,
} from "lucide-react";

const DOWNLOAD_HISTORY_KEY = "student-download-history";

function getFileTypeLabel(material) {
  const filename = material.originalFilename || material.filename || "";
  const extension = filename.includes(".") ? filename.split(".").pop().toLowerCase() : "";
  const mimeType = material.mimeType || "";

  if (mimeType.includes("pdf") || extension === "pdf") return "PDF";
  if (mimeType.includes("presentation") || ["ppt", "pptx"].includes(extension)) return "Slides";
  if (mimeType.includes("word") || ["doc", "docx"].includes(extension)) return "Document";
  if (mimeType.includes("sheet") || ["xls", "xlsx", "csv"].includes(extension)) return "Spreadsheet";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "Image";
  if (["zip", "rar", "7z"].includes(extension)) return "Archive";
  return extension ? extension.toUpperCase() : "File";
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [downloadHistory, setDownloadHistory] = useState([]);

  useEffect(() => {
    fetchMaterials();

    const savedHistory = localStorage.getItem(DOWNLOAD_HISTORY_KEY);
    if (savedHistory) {
      try {
        setDownloadHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Failed to parse download history", error);
      }
    }
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await API.get("/materials");
      setMaterials(res.data);
    } catch (err) {
      console.error("Failed to fetch materials", err);
    }
  };

  const courses = useMemo(
    () => [...new Set(materials.map((material) => material.course))].sort(),
    [materials]
  );

  const fileTypes = useMemo(
    () => [...new Set(materials.map((material) => getFileTypeLabel(material)))].sort(),
    [materials]
  );

  const filteredMaterials = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...materials]
      .filter((material) => {
        const matchesSearch =
          !normalizedSearch ||
          material.title.toLowerCase().includes(normalizedSearch) ||
          material.course.toLowerCase().includes(normalizedSearch) ||
          (material.description || "").toLowerCase().includes(normalizedSearch) ||
          (material.uploadedBy?.name || "").toLowerCase().includes(normalizedSearch);

        const matchesCourse = !selectedCourse || material.course === selectedCourse;
        const matchesType = !selectedType || getFileTypeLabel(material) === selectedType;

        return matchesSearch && matchesCourse && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (sortBy === "mostDownloaded") {
          return (b.downloads || 0) - (a.downloads || 0);
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [materials, searchTerm, selectedCourse, selectedType, sortBy]);

  const recentMaterials = useMemo(
    () => [...materials].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [materials]
  );

  const groupedMaterials = useMemo(
    () =>
      filteredMaterials.reduce((acc, material) => {
        if (!acc[material.course]) acc[material.course] = [];
        acc[material.course].push(material);
        return acc;
      }, {}),
    [filteredMaterials]
  );

  const downloadMaterial = async (material) => {
    try {
      const response = await API.get(`/materials/${material._id}/download`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = material.originalFilename || material.filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      const nextHistory = [
        {
          id: material._id,
          title: material.title,
          course: material.course,
          downloadedAt: new Date().toISOString(),
        },
        ...downloadHistory.filter((item) => item.id !== material._id),
      ].slice(0, 6);

      setDownloadHistory(nextHistory);
      localStorage.setItem(DOWNLOAD_HISTORY_KEY, JSON.stringify(nextHistory));

      setMaterials((currentMaterials) =>
        currentMaterials.map((currentMaterial) =>
          currentMaterial._id === material._id
            ? { ...currentMaterial, downloads: (currentMaterial.downloads || 0) + 1 }
            : currentMaterial
        )
      );
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download material");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCourse("");
    setSelectedType("");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-sm sm:text-base text-gray-700 hidden sm:inline">Welcome, {user?.name}</span>
              <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Materials</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materials.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all published courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Filter by course to narrow the list</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{downloadHistory.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Your last downloaded materials on this device</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Discover Materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="md:col-span-2 xl:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by title, course, lecturer, or description"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
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
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All File Types</option>
                  {fileTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-56"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="mostDownloaded">Sort: Most Downloaded</option>
                </select>
                <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recently Added</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMaterials.length > 0 ? recentMaterials.map((material) => (
                  <div key={material._id} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{material.title}</p>
                        <p className="text-xs text-gray-500">{material.course}</p>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        {getFileTypeLabel(material)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                      <span>{formatDate(material.createdAt)}</span>
                      <span>{material.downloads || 0} downloads</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No materials available yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Download History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {downloadHistory.length > 0 ? downloadHistory.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.course}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <CalendarDays className="w-3 h-3" />
                      <span>{formatDate(item.downloadedAt)}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">Your downloads will appear here after you open a file.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-8">
          {Object.keys(groupedMaterials).sort().map((course) => (
            <div key={course}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{course}</h2>
                <span className="text-sm text-gray-500">{groupedMaterials[course].length} materials</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedMaterials[course].map((material) => (
                  <Card key={material._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <FileText className="w-8 h-8 text-blue-600 shrink-0" />
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          {getFileTypeLabel(material)}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{material.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 min-h-[40px]">
                        {material.description || "No description provided for this material yet."}
                      </p>
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        <p>Uploaded by {material.uploadedBy?.name || "Unknown lecturer"}</p>
                        <p>Added {formatDate(material.createdAt)}</p>
                        <p>{material.downloads || 0} total downloads</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => downloadMaterial(material)}
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Material</span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {Object.keys(groupedMaterials).length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No materials found</h3>
            <p className="text-gray-600">Try adjusting your search, file type, or course filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
