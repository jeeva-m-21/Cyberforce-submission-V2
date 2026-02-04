"""RAG subsystem: intelligent retrieval with metadata-driven ranking.
Uses keyword matching, domain mapping, and metadata weights for optimal context injection.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Dict, Tuple
import re


class RAG:
    def __init__(self, docs_dir: Path):
        self.docs_dir = docs_dir
        self.metadata = self._load_metadata()
        self.doc_cache = {}
        self._load_all_documents()

    def _load_metadata(self) -> Dict:
        """Load RAG metadata for intelligent retrieval."""
        metadata_path = self.docs_dir / "RAG_METADATA.json"
        try:
            with open(metadata_path) as f:
                return json.load(f)["rag_metadata"]
        except (FileNotFoundError, json.JSONDecodeError):
            return {"documents": [], "module_type_mapping": {}}

    def _load_all_documents(self) -> None:
        """Preload all markdown documents for fast retrieval."""
        for doc_info in self.metadata.get("documents", []):
            doc_path = self.docs_dir / doc_info["filename"]
            if doc_path.exists():
                self.doc_cache[doc_info["id"]] = {
                    "content": doc_path.read_text(),
                    "metadata": doc_info
                }

    def query(self, query_text: str, top_k: int = 5, 
              module_type: str = None, context_limit: int = 2000) -> List[str]:
        """
        Retrieve top-k most relevant documents.
        
        Strategy:
        1. Extract keywords from query
        2. Match against document keywords and domain mapping
        3. Boost scores based on module type if provided
        4. Rank by hybrid score (keyword + domain + priority)
        5. Trim to context token limit
        """
        if not self.doc_cache:
            return []

        scores = self._score_documents(query_text, module_type)
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        
        results = []
        token_count = 0
        context_limit_tokens = context_limit or 2000
        
        for doc_id, score in ranked[:top_k]:
            if score < 0.65:  # Relevance threshold
                break
                
            doc_info = self.doc_cache[doc_id]
            content = doc_info["content"]
            
            # Truncate if needed
            if token_count + len(content.split()) > context_limit_tokens:
                remaining_tokens = context_limit_tokens - token_count
                content = " ".join(content.split()[:remaining_tokens])
            
            results.append(content)
            token_count += len(content.split())
        
        return results

    def _score_documents(self, query_text: str, 
                        module_type: str = None) -> Dict[str, float]:
        """Hybrid scoring: keyword + domain + priority."""
        scores = {}
        query_lower = query_text.lower()
        keywords = self._extract_keywords(query_lower)
        
        for doc_id, doc_info in self.doc_cache.items():
            metadata = doc_info["metadata"]
            content = doc_info["content"]
            
            # 1. Keyword match score (0.0-1.0)
            keyword_score = self._keyword_match_score(
                keywords, 
                metadata.get("keywords", []),
                content
            )
            
            # 2. Domain relevance (from module type)
            domain_score = 0.0
            if module_type:
                domain_score = self._domain_match_score(module_type, doc_id)
            
            # 3. Document priority weight
            priority_weight = {
                "CRITICAL": 1.0,
                "HIGH": 0.85,
                "MEDIUM": 0.7,
                "LOW": 0.5
            }.get(metadata.get("priority", "MEDIUM"), 0.7)
            
            # 4. Base search weight
            base_weight = metadata.get("search_weight", 0.8)
            
            # Hybrid score: 0.4 keyword, 0.3 domain, 0.15 priority, 0.15 base weight
            hybrid_score = (
                0.4 * keyword_score +
                0.3 * domain_score +
                0.15 * priority_weight +
                0.15 * base_weight
            )
            
            scores[doc_id] = hybrid_score
        
        return scores

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract meaningful keywords from query."""
        # Remove common words
        stopwords = {
            "the", "a", "an", "and", "or", "is", "in", "to", "of",
            "for", "with", "how", "what", "when", "where", "should"
        }
        
        # Split and clean
        words = re.findall(r'\w+', query.lower())
        return [w for w in words if w not in stopwords and len(w) > 2]

    def _keyword_match_score(self, query_keywords: List[str], 
                            doc_keywords: List[str], 
                            content: str) -> float:
        """Score how well query keywords match document keywords and content."""
        if not query_keywords:
            return 0.0
        
        matches = 0
        for keyword in query_keywords:
            # Exact keyword match
            if keyword in doc_keywords:
                matches += 2
            # Hyphenated variant
            elif f"{keyword}-" in " ".join(doc_keywords):
                matches += 1
            # Content contains keyword
            elif keyword in content.lower():
                matches += 0.5
        
        # Normalize to 0-1
        return min(1.0, matches / (len(query_keywords) * 2))

    def _domain_match_score(self, module_type: str, doc_id: str) -> float:
        """Score how relevant document is to module type."""
        module_mapping = self.metadata.get("module_type_mapping", {})
        relevant_docs = module_mapping.get(module_type, [])
        
        if doc_id in relevant_docs:
            return 1.0
        
        # Check if module type appears in hints
        search_hints = self.metadata.get("search_hints", {})
        type_hint = search_hints.get(f"when_module_is_{module_type}", {})
        
        if doc_id == type_hint.get("primary"):
            return 0.9
        elif doc_id in type_hint.get("secondary", []):
            return 0.6
        elif doc_id in type_hint.get("avoid", []):
            return 0.2
        
        return 0.3  # Generic relevance

    def query_by_domain(self, domain: str, top_k: int = 3) -> List[str]:
        """Retrieve top documents for a specific domain."""
        domain_mapping = self.metadata.get("domain_mapping", {})
        doc_ids = domain_mapping.get(domain, [])
        
        results = []
        for doc_id in doc_ids[:top_k]:
            if doc_id in self.doc_cache:
                results.append(self.doc_cache[doc_id]["content"])
        
        return results

    def query_by_standard(self, standard: str, top_k: int = 3) -> List[str]:
        """Retrieve documents covering a specific standard."""
        standards_mapping = self.metadata.get("standards_coverage", {})
        doc_ids = standards_mapping.get(standard, [])
        
        results = []
        for doc_id in doc_ids[:top_k]:
            if doc_id in self.doc_cache:
                results.append(self.doc_cache[doc_id]["content"])
        
        return results
