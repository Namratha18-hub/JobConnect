import api from "./api";

export interface ExternalInternship {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: string;
  duration: string;
  stipend: string;
  deadline: string | null;
  domain: string;
  category?: string;
  eligibleYears?: string;
  source: string;
  sourceUrl: string;
  verifiedOn: string | null;
  availabilityNote: string;
}

export interface SavedExternalInternship
  extends ExternalInternship {
  studentId: number;
  savedAt: string;
}

/*
 * Fetch currently live external internships.
 */
export async function getExternalInternships(): Promise<
  ExternalInternship[]
> {
  const response = await api.get<ExternalInternship[]>(
    "/api/external-internships"
  );

  return response.data;
}

/*
 * Fetch saved external internships for the authenticated student.
 */
export async function getSavedExternalInternships(): Promise<
  SavedExternalInternship[]
> {
  const response =
    await api.get<SavedExternalInternship[]>(
      "/api/saved-external-internships"
    );

  return response.data;
}

/*
 * Save an external internship.
 * The backend determines the student from the authentication token.
 */
export async function saveExternalInternship(
  externalInternshipId: string
): Promise<SavedExternalInternship> {
  const response =
    await api.post<SavedExternalInternship>(
      "/api/saved-external-internships",
      {
        externalInternshipId,
      }
    );

  return response.data;
}

/*
 * Remove a saved external internship.
 */
export async function deleteSavedExternalInternship(
  externalInternshipId: string
): Promise<void> {
  await api.delete(
    `/api/saved-external-internships/${encodeURIComponent(
      externalInternshipId
    )}`
  );
}