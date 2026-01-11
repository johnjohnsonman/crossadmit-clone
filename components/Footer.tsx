import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-sage-800 text-sage-200 py-6 md:py-12 mt-10 md:mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">크로스어드밋</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/about" className="hover:text-tea-300 transition-colors">
                  ABOUT US
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-tea-300 transition-colors">
                  CONTACT
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">법적 고지</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>
                <Link href="/privacy" className="hover:text-tea-300 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-tea-300 transition-colors">
                  이용약관
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">연락처</h3>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
              <li>사업자등록번호: 662-27-00450</li>
              <li>고객센터: 카카오톡 '크로스어드밋'</li>
              <li>이메일: hello@chairpark.com</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm md:text-lg font-serif text-white mb-2 md:mb-4">소셜</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-xs md:text-sm hover:text-tea-300 transition-colors">
                카카오톡
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-sage-700 mt-4 md:mt-8 pt-4 md:pt-8 text-center text-xs md:text-sm">
          <p>Copyright ⓒ CrossAdmit.com All right reserved</p>
        </div>
      </div>
    </footer>
  );
}


