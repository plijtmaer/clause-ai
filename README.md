# Clause AI Analyzer

**Clause AI** is an advanced AI-powered legal document analyzer that helps users understand complex legal agreements. It specializes in analyzing Privacy Policies, Terms of Service, NDAs, Contracts, EULAs, and other legal documents to make them accessible and understandable.

![Clause AI Interface](https://img.shields.io/badge/Next.js-15.3.3-black?logo=next.js)
![AI Powered](https://img.shields.io/badge/AI-GPT--4o--mini-blue?logo=openai)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)

## ✨ Features

### 🔍 **Multi-Document Analysis**
- **Privacy Policies**: Data collection practices, user rights, sharing policies
- **Terms of Service**: User obligations, platform rights, liability clauses
- **NDAs**: Confidentiality scope, restrictions, obligations
- **Contracts**: Terms, liability, termination clauses
- **EULAs**: Software rights, restrictions, warranties
- **Cookie Policies**: Tracking mechanisms, consent requirements

### 🎯 **Intelligent Input Processing**
- **URL Analysis**: Automatically fetches and analyzes documents from URLs
- **Text Input**: Process pasted document content directly
- **File Upload**: Upload PDF and DOCX files with drag-and-drop functionality
- **Smart Detection**: Automatically detects document type and content structure
- **Input Validation**: Real-time validation for URLs, text content, and file types

### 📊 **Comprehensive Scoring System**
- **Privacy Score**: Weighted scoring based on document type
- **Risk Assessment**: Identifies high and medium-risk clauses
- **Transparency Rating**: Evaluates document clarity and user-friendliness
- **Actionable Recommendations**: Specific advice for users

### 🚀 **Performance Optimizations**
- **Deterministic Architecture**: Predictable, step-by-step processing
- **Real-time Progress Tracking**: Live status updates during analysis
- **Optimized Text Processing**: Efficient keyword matching and content analysis
- **Timeout Management**: 90-second timeout with proper error handling

### 🎨 **Modern UI/UX**
- **Triple Input Modes**: Toggle between URL, text, and file input
- **Progress Visualization**: Real-time progress bar with step indicators
- **Responsive Design**: Works seamlessly on all device sizes
- **Elegant Interface**: Modern glass-morphism design with smooth animations

### 🔐 **User Authentication & Management**
- **Mandatory Authentication**: Required login on app entry for all features
- **Supabase Auth Integration**: Secure email/password authentication
- **User Sessions**: Persistent login state across browser sessions  
- **User Dashboard**: Comprehensive analytics and document history
- **RAG Storage**: All documents (URL, text, files) stored with embeddings

## 🏗️ Architecture

### Backend Flow
```
1. Content Extraction (URLs/Text/Files) → 2. Document Analysis → 3. Privacy Scoring → 4. RAG Storage → 5. AI Summary Generation
```

### Key Components
- **Deterministic Processing**: No dependency on AI model tool decisions
- **Progress Tracking**: Real-time status updates for each processing step
- **Error Handling**: Comprehensive error management with specific user feedback
- **Performance Optimization**: Reduced processing time through efficient algorithms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm package manager
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/plijtmaer/clause-ai.git
   cd clause-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Supabase Configuration (required for file uploads and authentication)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Optional: For additional vectorize features
   VECTORIZE_API_KEY=your_vectorize_api_key_here
   ```

4. **Supabase Database Setup** (for file upload functionality and authentication)
   
   **Option A: Quick Setup**
   Run the complete setup script from `supabase-setup.sql` in your Supabase SQL Editor.
   
   **Option B: Manual Setup**
   Run this SQL in your Supabase SQL Editor:
   ```sql
   -- Enable the pgvector extension
   create extension if not exists vector;
   
   -- Create the document_chunks table
   create table if not exists public.document_chunks (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null references auth.users(id) ON DELETE CASCADE,
     doc_id uuid not null,
     content text not null,
     embedding vector(1536),
     chunk_index int,
     created_at timestamp default now()
   );
   
   -- Enable Row Level Security
   alter table public.document_chunks enable row level security;
   
   -- Create policy for users to access their own documents
   create policy "Users can access their own document chunks"
   on public.document_chunks for all
   using (auth.uid() = user_id);
   
   -- Create performance indexes
   create index idx_document_chunks_user_id on public.document_chunks(user_id);
   create index idx_document_chunks_embedding on public.document_chunks 
   using ivfflat (embedding vector_cosine_ops) with (lists = 100);
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   pnpm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## 💡 Usage

### URL Analysis
1. Select the "URL" tab
2. Paste a legal document URL (Privacy Policy, Terms of Service, etc.)
3. Click "Analyze Document"
4. Watch real-time progress as the document is processed
5. Review the comprehensive analysis results

### Text Analysis
1. Select the "Text" tab
2. Paste the document content (minimum 100 words)
3. Click "Analyze Document"
4. Monitor the analysis progress
5. Get detailed insights and recommendations

### File Upload Analysis
1. Select the "File" tab
2. Drag and drop a PDF or DOCX file (max 10MB)
3. Click "Process Document"
4. Watch real-time progress: Upload → Text Extraction → Chunking → Embeddings → Storage
5. Automatic analysis begins once processing is complete

### Dashboard Access
1. Click the dashboard icon in the top-right user menu
2. View comprehensive analytics and KPIs
3. Browse document history with scores and risk levels
4. Track analysis trends and statistics
5. Access all your previously analyzed documents

## 🔐 **Authenticated Features (Required Login)**

All users must create a free account to access Clause AI. Once authenticated, you get:

### **Core Analysis Features**
- ✅ **URL Analysis**: Analyze documents from any public URL with RAG storage
- ✅ **Text Analysis**: Paste and analyze document content with RAG storage  
- ✅ **File Upload**: Upload PDF and DOCX documents (max 10MB)
- ✅ **Full AI Analysis**: Complete legal analysis with scoring and recommendations
- ✅ **Real-time Processing**: 5-step analysis with progress tracking

### **Advanced RAG & Dashboard Features**
- ✅ **Document Storage**: All documents stored securely with embeddings
- ✅ **RAG Functionality**: Advanced document search and comparison capabilities
- ✅ **Document History**: Access previously analyzed documents
- ✅ **Analytics Dashboard**: Comprehensive KPIs and document statistics
- ✅ **Risk Tracking**: Monitor high-risk documents and trends
- ✅ **Score Analytics**: Track average scores and analysis patterns

### Analysis Results
- **Document Summary**: Clear overview in plain language
- **Key Findings**: Important clauses and provisions
- **Risk Assessment**: Identified concerns and red flags
- **Privacy Score**: Comprehensive scoring with breakdown
- **Recommendations**: Actionable advice for users

## 🔧 Technical Details

### Technology Stack
- **Frontend**: Next.js 15.3.3, React 19.1.0, TypeScript
- **Backend**: Next.js API Routes, OpenAI GPT-4o-mini
- **Database**: Supabase with pgvector for embeddings storage
- **File Processing**: pdf-parse, mammoth for document extraction
- **Text Processing**: LangChain for semantic chunking
- **Embeddings**: OpenAI text-embedding-3-small
- **Styling**: Tailwind CSS with custom animations
- **Icons**: Lucide React
- **Package Manager**: pnpm

### Performance Features
- **Optimized Text Processing**: Efficient keyword matching algorithms
- **Progress Tracking**: Real-time status updates during analysis
- **Timeout Management**: 90-second processing timeout
- **Error Handling**: Comprehensive error management
- **Responsive Design**: Mobile-first approach

### API Endpoints
- `POST /api/chat` - Main document analysis endpoint with RAG storage
- `POST /api/upload` - File upload endpoint for PDF/DOCX processing
- Supports URL, text, and file-based document processing
- Returns structured analysis results with progress tracking
- Automatic RAG storage for all authenticated users

## 🎯 Scoring System

### Privacy Policies
- **User Rights**: 35% weight
- **Data Collection**: 25% weight  
- **Data Sharing**: 25% weight
- **Security**: 15% weight

### Terms of Service
- **User Rights**: 30% weight
- **Data Sharing**: 30% weight
- **Data Collection**: 20% weight
- **Security**: 20% weight

### NDAs & Contracts
- **Security**: 35% weight
- **Data Sharing**: 30% weight
- **User Rights**: 25% weight
- **Data Collection**: 10% weight

## 🔒 Privacy & Security

- **No Data Storage**: Documents are processed in real-time and not stored
- **Secure Processing**: All communication encrypted via HTTPS
- **API Key Security**: OpenAI API keys stored securely in environment variables
- **Error Handling**: Comprehensive error management without exposing sensitive information

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/YourFeature
   ```
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**
   ```bash
   git commit -m "Add: Your feature description"
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/YourFeature
   ```
7. **Create a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Add appropriate comments for complex logic
- Ensure responsive design compatibility
- Test thoroughly before submitting

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [https://github.com/plijtmaer/clause-ai](https://github.com/plijtmaer/clause-ai)
- **Issues**: [Report bugs or request features](https://github.com/plijtmaer/clause-ai/issues)
- **Documentation**: [API Documentation](https://github.com/plijtmaer/clause-ai/wiki)

---

**Made with ❤️ by the Clause AI Team**
