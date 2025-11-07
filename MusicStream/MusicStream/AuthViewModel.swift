import Foundation

class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    
    func signUpWithEmail() {
        print("Sign up with email")
    }
    
    func signInWithEmail(email: String, password: String) {
        isAuthenticated = true
    }
    
    func continueAsGuest() {
        isAuthenticated = true
    }
    
    func signOut() {
        isAuthenticated = false
    }
}
