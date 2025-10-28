export interface Candidate {
  id: string;
  job_id?: string;
  job_title?: string;
  attributes: Array<{
    key: string;
    label: string;
    value: string;
    order: number;
  }>;
}

export interface Job {
  id: string;
  slug: string;
  title: string;
  status: string;
  salary_range: {
    min: number;
    max: number;
    currency: string;
    display_text: string;
  };
  list_card?: {
    badge: string;
    started_on_text: string;
    cta: string;
  };
  description?: string;
  application_form?: {
    sections: Array<{
      title: string;
      fields: Array<{
        key: string;
        validation: {
          required: boolean;
        };
      }>;
    }>;
  };
}

export interface JobConfig {
  application_form: {
    sections: Array<{
      title: string;
      fields: Array<{
        key: string;
        validation: {
          required: boolean;
        };
      }>;
    }>;
  };
}

export interface User {
  id?: string;
  username?: string;
  name?: string;
  email: string;
  role: string;
  password?: string;
}

export interface LoginResponse {
  message: string;
  user: {
    email: string;
    role: string;
    name: string;
  };
}