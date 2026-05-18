import publicCmsService from "../../../services/publicCmsService";

// Thin facade around the existing public CMS service so the editor depends on
// a stable API surface. Backend contract is intentionally unchanged.
const cmsApiService = {
  fetchAdminCms: () => publicCmsService.getAdmin(),
  fetchPublicCms: () => publicCmsService.getPublic(),
  saveCms: (publicCms) => publicCmsService.update(publicCms),
  uploadMedia: (file) => publicCmsService.uploadMedia(file),
};

export default cmsApiService;
