
import React, { useState } from 'react';
import { LOGO_SVG, COLORS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  onAdminClick: () => void;
  setCurrentPage: (page: string, category?: string, subCategory?: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onAdminClick, setCurrentPage }) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories = [
    { name: '테크·가전', sub: ['생활가전', '주방가전', '스마트가전', '웨어러블', '로봇', 'App·Web', '주변기기'] },
    { name: '패션', sub: ['의류', '잡화', '슈즈', '액세서리', '언더웨어', '기능성 의류'] },
    { name: '뷰티', sub: ['스킨케어', '메이크업', '바디케어', '향수', '헤어케어', '클렌징'] },
    { name: '럭셔리', sub: ['명품가방', '명품지갑', '명품시계', '명품의류', '프리미엄 슈즈'] },
    { name: '홈·리빙', sub: ['가구', '인테리어', '침구', '주방용품', '생활용품'] },
    { name: '스포츠', sub: ['캠핑', '골프', '러닝', '테니스', '헬스', '홈트레이닝'] },
    { name: '푸드', sub: ['건강식품', '간편식', '디저트', '음료/주류', '신선식품'] },
    { name: '도서', sub: ['베스트셀러', '자기계발', '경제/경영', '소설', '취미/실용'] }
  ];

  const handleCategoryAction = (catName: string, subCatName?: string) => {
    setCurrentPage('category', catName, subCatName);
    setHoveredCategory(null);
  };

  const navItems = [
    { name: '특가/쿠폰', page: 'deals' },
    { name: '라이브', page: 'live' },
    { name: '베스트', page: 'best' },
    { name: '인사이트', page: 'insight' },
    { name: '공지/이벤트', page: 'notice' }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-red-100 selection:text-red-600">
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setCurrentPage('home')}>
              <div className="transition-transform group-hover:scale-110 duration-300">
                {LOGO_SVG("w-9 h-9")}
              </div>
              <span className="font-extrabold text-xl tracking-tighter" style={{ color: COLORS.primary }}>YES DUTY FREE</span>
            </div>
            <nav className="hidden md:flex gap-8 text-[15px] font-semibold text-gray-700">
              {navItems.map((item) => (
                <button 
                  key={item.name} 
                  onClick={() => setCurrentPage(item.page)} 
                  className="hover:text-red-500 transition-colors relative after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-red-500 after:transition-all hover:after:w-full"
                >
                  {item.name}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative flex items-center hidden lg:flex group">
              <input 
                type="text" 
                placeholder="어떤 면세품을 찾으시나요?" 
                className="bg-gray-100/80 rounded-full px-5 py-2.5 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-white transition-all border border-transparent focus:border-red-500/30"
              />
              <svg className="w-5 h-5 absolute right-4 text-gray-400 group-focus-within:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
              <button onClick={() => setCurrentPage('mypage')} className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">MY PAGE</button>
              <button onClick={onAdminClick} className="text-xs font-bold text-gray-300 hover:text-gray-900 transition-colors">ADMIN</button>
              <button onClick={() => setCurrentPage('login')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95">
                로그인
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white border-b border-gray-50 relative overflow-visible shadow-sm">
          <div className="max-w-7xl mx-auto px-4 flex gap-8 text-[14px] font-bold overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <div 
                key={cat.name} 
                className="relative shrink-0"
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button 
                  onClick={() => handleCategoryAction(cat.name)}
                  className={`py-4 px-1 transition-all border-b-2 hover:text-red-600 ${hoveredCategory === cat.name ? 'border-red-600 text-red-600' : 'border-transparent text-gray-800'}`}
                >
                  {cat.name}
                </button>
              </div>
            ))}
          </div>

          {hoveredCategory && (
            <div 
              className="absolute left-0 right-0 top-full bg-white border-b border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.08)] z-[110] animate-in fade-in slide-in-from-top-2 duration-300"
              onMouseEnter={() => setHoveredCategory(hoveredCategory)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-5 gap-10">
                <div className="col-span-1 border-r border-gray-50 pr-8">
                  <h4 className="text-2xl font-black text-gray-900 mb-3 tracking-tighter">{hoveredCategory}</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-semibold">프리미엄 면세 셀렉션</p>
                  <button 
                    onClick={() => handleCategoryAction(hoveredCategory)}
                    className="mt-8 px-5 py-2.5 rounded-full border border-gray-100 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    카테고리 전체보기 &rarr;
                  </button>
                </div>
                <div className="col-span-4 grid grid-cols-4 gap-y-4 gap-x-6">
                  {categories.find(c => c.name === hoveredCategory)?.sub.map((sub) => (
                    <button 
                      key={sub} 
                      onClick={() => handleCategoryAction(hoveredCategory, sub)}
                      className="text-left text-[14px] text-gray-500 hover:text-red-600 hover:translate-x-1 transition-all py-1.5"
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-gray-900 text-white pt-20 pb-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-white p-1 rounded-lg">{LOGO_SVG("w-8 h-8")}</div>
                <span className="font-black text-xl tracking-tighter">YES DUTY FREE</span>
              </div>
              <p className="text-sm text-gray-400 leading-loose">
                (주)원케이션 | 대표이사: 홍길동<br/>
                사업자등록번호: 000-00-00000<br/>
                서울시 강남구 테헤란로 원빌딩 15층
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 col-span-1 md:col-span-3 gap-10">
              <div>
                <h4 className="font-bold text-sm text-gray-200 mb-6">고객지원</h4>
                <ul className="space-y-4 text-sm text-gray-400 font-medium">
                  <li className="hover:text-white cursor-pointer" onClick={() => setCurrentPage('notice')}>공지사항</li>
                  <li className="hover:text-white cursor-pointer">자주 묻는 질문</li>
                  <li className="hover:text-white cursor-pointer">1:1 실시간 문의</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-200 mb-6">서비스 안내</h4>
                <ul className="space-y-4 text-sm text-gray-400 font-medium">
                  <li className="hover:text-white cursor-pointer">이용약관</li>
                  <li className="hover:text-white cursor-pointer text-red-400">개인정보처리방침</li>
                  <li className="hover:text-white cursor-pointer">글로벌 배송 안내</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-200 mb-6">Social</h4>
                <div className="flex gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer">
                      <div className="w-5 h-5 bg-gray-400/20 rounded-sm"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-gray-800 flex flex-col md:flex-row justify-between gap-6 text-[12px] text-gray-500 font-semibold uppercase tracking-wider">
            <span>&copy; 2025 Yes Duty Free. All rights reserved.</span>
            <div className="flex gap-8">
              <span>Korea Duty Free Membership</span>
              <span>Global Logistics Partner</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
